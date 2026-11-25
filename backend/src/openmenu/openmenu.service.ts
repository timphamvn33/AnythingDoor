import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value: unknown): number | null {
  const raw = typeof value === 'number' ? String(value) : text(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isSafeInteger(Math.round(amount * 100)) ? amount : null;
}

@Injectable()
export class OpenMenuService {
  private requestTimes: number[] = [];

  private async request(path: string, params: Record<string, string>): Promise<JsonObject | null> {
    const key = process.env.OPENMENU_API_KEY?.trim();
    if (!key) throw new ServiceUnavailableException('OpenMenu is not configured on the server.');

    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60_000);
    if (this.requestTimes.length >= 60) {
      throw new HttpException('OpenMenu request limit reached. Try again shortly.', 429);
    }
    this.requestTimes.push(now);

    const url = new URL(`https://www.openmenu.com/api/v2/${path}`);
    url.searchParams.set('key', key);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    } catch {
      throw new BadGatewayException('OpenMenu could not be reached.');
    }
    if (response.status === 204) return null;
    if (!response.ok) throw new BadGatewayException('OpenMenu could not complete the request.');

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException('OpenMenu returned an invalid response.');
    }
    const envelope = object(object(payload)?.response);
    const status = object(envelope?.api)?.status;
    if (Number(status) === 204) return null;
    if (Number(status) !== 200 || !object(envelope?.result)) {
      throw new BadGatewayException('OpenMenu returned an error or invalid response.');
    }
    return object(envelope?.result);
  }

  async search(zip: unknown, name: unknown) {
    if (typeof zip !== 'string' || !/^\d{5}$/.test(zip)) {
      throw new BadRequestException('Enter a five-digit US ZIP code.');
    }
    if (typeof name !== 'string' || name.trim().length > 100) {
      throw new BadRequestException('Restaurant name must be at most 100 characters.');
    }
    const params: Record<string, string> = { postal_code: zip, country: 'US' };
    if (name.trim()) params.s = name.trim();
    const result = await this.request('location.php', params);
    if (!result) return { restaurants: [] };
    if (!Array.isArray(result.restaurants)) {
      throw new BadGatewayException('OpenMenu returned an invalid restaurant list.');
    }
    return {
      restaurants: result.restaurants.flatMap(value => {
        const row = object(value);
        const id = text(row?.id);
        const restaurantName = text(row?.restaurant_name);
        if (!id || id.length > 512 || !restaurantName) return [];
        return [
          {
            id,
            name: restaurantName,
            address: [
              row?.address_1,
              row?.address_2,
              row?.city_town,
              row?.state_province,
              row?.postal_code,
            ]
              .map(text)
              .filter(Boolean)
              .join(', '),
            updatedAt: text(row?.fDateUpdated) || null,
          },
        ];
      }),
    };
  }

  async menu(id: unknown) {
    if (typeof id !== 'string' || !id.trim() || id.length > 512) {
      throw new BadRequestException('Invalid OpenMenu restaurant ID.');
    }
    const result = await this.request('restaurant.php', { id });
    if (!result) return { name: '', groups: [] };
    const restaurantName = text(object(result.restaurant_info)?.restaurant_name);
    if (!restaurantName || !Array.isArray(result.menus)) {
      throw new BadGatewayException('OpenMenu returned an invalid menu.');
    }

    const groups: {
      name: string;
      items: {
        id: string;
        name: string;
        description: string;
        price: number | null;
        currency: string | null;
      }[];
    }[] = [];
    for (const rawMenu of result.menus) {
      const menu = object(rawMenu);
      if (!menu || !Array.isArray(menu.menu_groups)) continue;
      const currency = text(menu.currency_symbol).toUpperCase();
      for (const rawGroup of menu.menu_groups) {
        const group = object(rawGroup);
        if (!group || !Array.isArray(group.menu_items)) continue;
        const groupName =
          [text(menu.menu_name), text(group.group_name)].filter(Boolean).join(' — ') || 'Menu';
        const items = group.menu_items.flatMap(rawItem => {
          const item = object(rawItem);
          const itemName = text(item?.menu_item_name);
          if (!itemName) return [];
          const description = text(item?.menu_item_description);
          const itemPrice = price(item?.menu_item_price);
          const itemId = createHash('sha256')
            .update(JSON.stringify([id, groupName, itemName, description, itemPrice]))
            .digest('hex');
          return [
            {
              id: `openmenu-${itemId}`,
              name: itemName,
              description,
              price: itemPrice,
              currency: currency || null,
            },
          ];
        });
        if (items.length) groups.push({ name: groupName, items });
      }
    }
    return { name: restaurantName, groups };
  }
}
