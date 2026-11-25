import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

type JsonObject = Record<string, unknown>;

type Usage = {
  limit: number;
  remaining: number;
  resetAt: number | null;
  observedAt: string;
};

function headerInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cuisines(row: JsonObject): string[] {
  const values = Array.isArray(row.cuisines) ? row.cuisines.map(text).filter(Boolean) : [];
  const primary = text(row.cuisine_primary);
  if (primary && !values.includes(primary)) values.unshift(primary);
  return values;
}

function restaurantId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9_-]{1,64}$/i.test(value)) {
    throw new BadRequestException('Invalid SousLab restaurant ID.');
  }
  return value;
}

@Injectable()
export class SousLabService {
  private readonly cache = new Map<string, { expiresAt: number; value: JsonObject }>();
  private readonly pending = new Map<string, Promise<JsonObject>>();
  private requestTimes: number[] = [];
  private queue = Promise.resolve();
  private lastRequestAt = 0;
  private usage: { keyHash: string; value: Usage } | null = null;

  getUsage(userId: string) {
    const allowed = (process.env.SOUSLAB_USAGE_USER_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    if (!userId || !allowed.includes(userId)) {
      throw new ForbiddenException('SousLab usage access is not authorized.');
    }
    const key = process.env.SOUSLAB_API_KEY?.trim();
    const keyHash = key ? createHash('sha256').update(key).digest('hex') : null;
    return { usage: this.usage?.keyHash === keyHash ? this.usage.value : null };
  }

  private async request(
    path: string,
    params: Record<string, string>,
    validate: (value: JsonObject) => boolean,
  ): Promise<JsonObject> {
    const key = process.env.SOUSLAB_API_KEY?.trim();
    if (!key) throw new ServiceUnavailableException('SousLab is not configured on the server.');
    const url = new URL(path, 'https://api.souslab.site');
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    const cacheKey = createHash('sha256').update(key).update(url.href).digest('hex');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    this.cache.delete(cacheKey);
    const pending = this.pending.get(cacheKey);
    if (pending) return pending;

    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60_000);
    if (this.requestTimes.length >= 60) {
      throw new HttpException('SousLab request limit reached. Try again shortly.', 429);
    }
    this.requestTimes.push(now);

    const operation = this.fetchData(url, key).then(value => {
      if (!validate(value)) throw new BadGatewayException('SousLab returned an invalid response.');
      if (this.cache.size >= 100) {
        const oldest = this.cache.keys().next().value;
        if (oldest) this.cache.delete(oldest);
      }
      this.cache.set(cacheKey, { value, expiresAt: Date.now() + 5 * 60_000 });
      return value;
    });
    this.pending.set(cacheKey, operation);
    try {
      return await operation;
    } finally {
      this.pending.delete(cacheKey);
    }
  }

  private async fetchData(url: URL, key: string): Promise<JsonObject> {
    const turn = this.queue.then(async () => {
      const delay = Math.max(0, 1100 - (Date.now() - this.lastRequestAt));
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      this.lastRequestAt = Date.now();
    });
    this.queue = turn;
    await turn;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'X-API-Key': key },
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
    } catch {
      throw new BadGatewayException('SousLab could not be reached.');
    }
    const limit = headerInteger(response.headers.get('X-RateLimit-Limit'));
    const remaining = headerInteger(response.headers.get('X-RateLimit-Remaining'));
    const resetAt = headerInteger(response.headers.get('X-RateLimit-Reset'));
    if (limit !== null && limit > 0 && remaining !== null && remaining <= limit) {
      this.usage = {
        keyHash: createHash('sha256').update(key).digest('hex'),
        value: {
          limit,
          remaining,
          resetAt: resetAt !== null && resetAt <= 8640000000000 ? resetAt : null,
          observedAt: new Date().toISOString(),
        },
      };
    }
    if (response.status === 429) {
      throw new HttpException('SousLab rate limit or record quota reached. Try again later.', 429);
    }
    if (response.status === 404) throw new NotFoundException('SousLab restaurant not found.');
    if (response.status === 400) {
      throw new BadRequestException(
        'SousLab rejected the request. Start a new search and try again.',
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException(
        'SousLab credentials or plan do not allow this request.',
      );
    }
    if (!response.ok) throw new BadGatewayException('SousLab could not complete the request.');

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException('SousLab returned an invalid response.');
    }
    const result = object(payload);
    if (!result) throw new BadGatewayException('SousLab returned an invalid response.');
    return result;
  }

  async search(zip: unknown, name: unknown, cursor: unknown) {
    if (typeof zip !== 'string' || !/^\d{5}(?:-\d{4})?$/.test(zip)) {
      throw new BadRequestException('Enter a US ZIP code (five digits or ZIP+4).');
    }
    if (typeof name !== 'string' || name.trim().length > 100) {
      throw new BadRequestException('Restaurant name must be at most 100 characters.');
    }
    if (cursor !== undefined && (typeof cursor !== 'string' || !cursor || cursor.length > 2000)) {
      throw new BadRequestException('Invalid search cursor.');
    }
    const params: Record<string, string> = { zip, limit: '20' };
    if (name.trim()) params.q = name.trim();
    if (typeof cursor === 'string') params.cursor = cursor;
    const result = await this.request(
      '/v1/restaurants',
      params,
      value =>
        Array.isArray(value.data) &&
        (value.next_cursor === null || typeof value.next_cursor === 'string'),
    );
    if (!Array.isArray(result.data))
      throw new BadGatewayException('SousLab returned an invalid restaurant list.');
    return {
      restaurants: result.data.flatMap(value => {
        const row = object(value);
        if (!row) return [];
        const id = text(row.restaurant_id);
        const restaurantName = text(row.name);
        if (!/^[a-z0-9_-]{1,64}$/i.test(id) || !restaurantName) return [];
        return [
          {
            id,
            name: restaurantName,
            address: [row?.street, row?.city, row?.state_code, row?.zip]
              .map(text)
              .filter(Boolean)
              .join(', '),
            cuisines: cuisines(row),
            itemCount:
              typeof row?.item_count === 'number' &&
              Number.isInteger(row.item_count) &&
              row.item_count >= 0
                ? row.item_count
                : null,
            status: text(row?.status) || null,
          },
        ];
      }),
      nextCursor: result.next_cursor,
    };
  }

  async restaurant(id: unknown) {
    const validId = restaurantId(id);
    const result = await this.request(
      `/v1/restaurants/${encodeURIComponent(validId)}`,
      {},
      value =>
        typeof value.restaurant_id === 'string' && /^[a-z0-9_-]{1,64}$/i.test(value.restaurant_id),
    );
    return {
      id: text(result.restaurant_id),
      name: text(result.name),
      address: [result.street, result.city, result.state_code, result.zip]
        .map(text)
        .filter(Boolean)
        .join(', '),
      description: text(result.description),
      phone: text(result.phone),
      cuisines: cuisines(result),
      status: text(result.status),
      lastSeen: text(result.last_seen),
    };
  }

  async menu(id: unknown) {
    const validId = restaurantId(id);
    const result = await this.request(
      `/v1/restaurants/${encodeURIComponent(validId)}/menu`,
      {},
      value =>
        typeof value.restaurant_id === 'string' &&
        Array.isArray(value.menus) &&
        value.menus.every(rawMenu => {
          const menu = object(rawMenu);
          return (
            menu &&
            Array.isArray(menu.sections) &&
            menu.sections.every(rawSection => {
              const section = object(rawSection);
              return section && Array.isArray(section.items);
            })
          );
        }),
    );
    if (typeof result.restaurant_id !== 'string' || !Array.isArray(result.menus)) {
      throw new BadGatewayException('SousLab returned an invalid menu.');
    }
    const groups: {
      name: string;
      items: {
        id: string;
        name: string;
        description: string;
        price: number | null;
        currency: string | null;
        outOfStock: boolean | null;
      }[];
    }[] = [];
    for (const rawMenu of result.menus) {
      const menu = object(rawMenu);
      if (!menu || !Array.isArray(menu.sections))
        throw new BadGatewayException('SousLab returned an invalid menu.');
      for (const rawSection of menu.sections) {
        const section = object(rawSection);
        if (!section || !Array.isArray(section.items))
          throw new BadGatewayException('SousLab returned an invalid menu.');
        const groupName =
          [text(menu.name), text(section.name)].filter(Boolean).join(' — ') || 'Menu';
        const items = section.items.flatMap(rawItem => {
          const item = object(rawItem);
          const uid = text(item?.item_uid);
          const itemName = text(item?.name);
          if (!uid || !itemName) return [];
          const rawPrice = item?.price;
          const itemPrice =
            typeof rawPrice === 'number' &&
            Number.isFinite(rawPrice) &&
            rawPrice > 0 &&
            Number.isSafeInteger(Math.round(rawPrice * 100))
              ? rawPrice
              : null;
          const currency = text(item?.currency).toUpperCase() || 'USD';
          const itemId = createHash('sha256')
            .update(JSON.stringify([result.restaurant_id, uid, itemPrice, currency]))
            .digest('hex');
          return [
            {
              id: `souslab-${itemId}`,
              name: itemName,
              description: text(item?.description),
              price: itemPrice,
              currency,
              outOfStock: typeof item?.out_of_stock === 'boolean' ? item.out_of_stock : null,
            },
          ];
        });
        if (items.length) groups.push({ name: groupName, items });
      }
    }
    return { groups };
  }
}
