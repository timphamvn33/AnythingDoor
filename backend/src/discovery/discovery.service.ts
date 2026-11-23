import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { DiscoveredRestaurant } from '@db/generated/prisma';
import { PrismaService } from '@src/prisma/prisma.service';

type Point = { latitude: number; longitude: number; radiusMiles: number };
type SearchResult = {
  center: Point;
  restaurants: (DiscoveredRestaurant & { distanceMiles: number })[];
  limited: boolean;
};
type OsmElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

const METERS_PER_MILE = 1609.344;
const MAX_RESULTS = 500;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const SUGGESTION_TOKEN_TTL_MS = 15 * 60 * 1000;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Invalid search request.');
  }
  return value as Record<string, unknown>;
}

function point(value: unknown): Point {
  const body = object(value);
  const { latitude, longitude, radiusMiles } = body;
  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof radiusMiles !== 'number' ||
    !Number.isFinite(radiusMiles) ||
    radiusMiles < 1 ||
    radiusMiles > 25
  ) {
    throw new BadRequestException('Provide valid coordinates and a radius from 1 to 25 miles.');
  }
  return { latitude, longitude, radiusMiles };
}

function distanceMiles(a: Point, latitude: number, longitude: number): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(latitude - a.latitude);
  const dLon = radians(longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(latitude)) * Math.sin(dLon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function listing(element: OsmElement) {
  if (!element || typeof element !== 'object') return null;
  const tags = element.tags;
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (
    typeof tags?.name !== 'string' ||
    !tags.name.trim() ||
    !['node', 'way', 'relation'].includes(element.type ?? '') ||
    !Number.isSafeInteger(element.id) ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  )
    return null;
  const category = (typeof tags.cuisine === 'string' ? tags.cuisine : '')
    .split(';')
    .map(value => value.trim().replace(/_/g, ' '))
    .filter(Boolean);
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const city = [tags['addr:city'], tags['addr:state'], tags['addr:postcode']]
    .filter(Boolean)
    .join(', ');
  const address = [street, city].filter(Boolean).join(', ') || null;
  let website: string | null = null;
  if (typeof tags.website === 'string' && tags.website) {
    try {
      const url = new URL(tags.website);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password)
        website = url.href;
    } catch {
      // Invalid source URLs are not shown as links.
    }
  }
  return {
    id: `${element.type}/${element.id}`,
    name: tags.name.trim(),
    category,
    latitude,
    longitude,
    address,
    website,
  };
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly searchCache = new Map<string, { expiresAt: number; result: SearchResult }>();
  private readonly pendingSearches = new Map<string, Promise<SearchResult>>();
  private readonly suggestionKey = process.env.JWT_ACCESS_SECRET
    ? createHmac('sha256', process.env.JWT_ACCESS_SECRET)
        .update('discovery-suggestions-v1')
        .digest()
    : randomBytes(32);

  constructor(private readonly prisma: PrismaService) {}

  private async timed<T>(stage: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    let success = false;
    try {
      const result = await operation();
      success = true;
      return result;
    } finally {
      this.logger.log(
        `Discovery ${stage} ${success ? 'ok' : 'failed'} ${Math.round(performance.now() - start)}ms`,
      );
    }
  }

  private suggestionToken(label: string, latitude: number, longitude: number): string {
    const payload = Buffer.from(
      JSON.stringify({
        label,
        latitude,
        longitude,
        expiresAt: Date.now() + SUGGESTION_TOKEN_TTL_MS,
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', this.suggestionKey).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  private suggestionPoint(
    token: unknown,
    location: string,
    radiusMiles: number,
  ): Point | undefined {
    if (token === undefined) return undefined;
    if (typeof token !== 'string' || token.length > 2048) {
      throw new BadRequestException('Invalid location suggestion.');
    }
    const parts = token.split('.');
    if (parts.length !== 2) throw new BadRequestException('Invalid location suggestion.');
    const signature = createHmac('sha256', this.suggestionKey).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], 'base64url');
    if (supplied.length !== signature.length || !timingSafeEqual(supplied, signature)) {
      this.logger.warn('Location suggestion could not be verified; using geocoding.');
      return undefined;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid location suggestion.');
    }
    const data = object(payload);
    if (
      data.label !== location ||
      typeof data.expiresAt !== 'number' ||
      data.expiresAt <= Date.now()
    ) {
      this.logger.log('Location suggestion expired or changed; using geocoding.');
      return undefined;
    }
    return point({ latitude: data.latitude, longitude: data.longitude, radiusMiles });
  }

  private async json(url: string, options: RequestInit): Promise<unknown> {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      if (!response.ok) {
        this.logger.warn(`Discovery provider returned HTTP ${response.status}`);
        throw new BadGatewayException('The discovery service could not complete the request.');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      this.logger.warn('Discovery provider request failed.');
      throw new BadGatewayException(
        'The discovery service is unavailable. Please try again later.',
      );
    }
  }

  async suggestions(input: unknown) {
    if (typeof input !== 'string' || input.trim().length < 3 || input.length > 200) {
      throw new BadRequestException('Enter at least 3 characters to get location suggestions.');
    }
    const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Address suggestions are not configured. Set GEOAPIFY_API_KEY on the backend.',
      );
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', input.trim());
    url.searchParams.set('filter', 'countrycode:us');
    url.searchParams.set('limit', '5');
    url.searchParams.set('format', 'geojson');
    url.searchParams.set('apiKey', apiKey);
    const result = await this.json(url.toString(), { headers: { Accept: 'application/json' } });
    if (
      !result ||
      typeof result !== 'object' ||
      !Array.isArray((result as { features?: unknown }).features)
    ) {
      throw new BadGatewayException('The address suggestion service returned an invalid response.');
    }

    const places = (result as { features: unknown[] }).features
      .flatMap(feature => {
        if (!feature || typeof feature !== 'object') return [];
        const properties = (feature as { properties?: unknown }).properties;
        if (!properties || typeof properties !== 'object') return [];
        const place = properties as {
          formatted?: unknown;
          country_code?: unknown;
          lat?: unknown;
          lon?: unknown;
        };
        if (
          typeof place.country_code !== 'string' ||
          place.country_code.toLowerCase() !== 'us' ||
          typeof place.formatted !== 'string' ||
          place.formatted.trim().length < 3 ||
          place.formatted.length > 200
        )
          return [];
        const label = place.formatted.trim();
        return [
          {
            label,
            ...(typeof place.lat === 'number' &&
            Number.isFinite(place.lat) &&
            place.lat >= -90 &&
            place.lat <= 90 &&
            typeof place.lon === 'number' &&
            Number.isFinite(place.lon) &&
            place.lon >= -180 &&
            place.lon <= 180
              ? { token: this.suggestionToken(label, place.lat, place.lon) }
              : {}),
          },
        ];
      })
      .slice(0, 5);
    return { suggestions: places.map(place => place.label), places };
  }

  async search(input: unknown) {
    const body = object(input);
    if (
      typeof body.location !== 'string' ||
      body.location.trim().length < 3 ||
      body.location.length > 200
    ) {
      throw new BadRequestException('Enter a US address, city and state, or ZIP code.');
    }
    const radiusMiles = body.radiusMiles;
    if (
      typeof radiusMiles !== 'number' ||
      !Number.isFinite(radiusMiles) ||
      radiusMiles < 1 ||
      radiusMiles > 25
    ) {
      throw new BadRequestException('Radius must be between 1 and 25 miles.');
    }
    const geocoder = process.env.OSM_GEOCODER_URL;
    const overpass = process.env.OSM_OVERPASS_URL;
    if (!geocoder || !overpass) {
      throw new ServiceUnavailableException(
        'Live discovery is not configured. Set OSM_GEOCODER_URL and OSM_OVERPASS_URL on the backend.',
      );
    }

    const location = body.location.trim();
    const selectedCenter = this.suggestionPoint(body.suggestionToken, location, radiusMiles);
    const key = createHash('sha256')
      .update(
        JSON.stringify([
          location.toLowerCase(),
          radiusMiles,
          geocoder,
          overpass,
          process.env.GEOAPIFY_API_KEY,
          selectedCenter,
        ]),
      )
      .digest('hex');
    const cached = this.searchCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log('Discovery cache hit');
      return { ...cached.result, cached: true };
    }
    this.searchCache.delete(key);
    const pending = this.pendingSearches.get(key);
    if (pending) return { ...(await pending), cached: false };

    const request = this.timed('live total', () =>
      this.searchLive(location, radiusMiles, geocoder, overpass, selectedCenter),
    );
    const tracked = this.pendingSearches.size < SEARCH_CACHE_MAX_ENTRIES;
    if (tracked) this.pendingSearches.set(key, request);
    try {
      const result = await request;
      this.searchCache.delete(key);
      if (this.searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
        this.searchCache.delete(this.searchCache.keys().next().value);
      }
      this.searchCache.set(key, { result, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
      return { ...result, cached: false };
    } finally {
      if (tracked) this.pendingSearches.delete(key);
    }
  }

  private async searchLive(
    location: string,
    radiusMiles: number,
    geocoder: string,
    overpass: string,
    selectedCenter?: Point,
  ): Promise<SearchResult> {
    const center =
      selectedCenter ??
      (await this.timed('geocoder', () => this.geocode(location, radiusMiles, geocoder)));
    if (selectedCenter) this.logger.log('Discovery geocoder skipped (selected suggestion)');
    const radius = Math.round(radiusMiles * METERS_PER_MILE);
    const query = `[out:json][timeout:25];nwr(around:${radius},${center.latitude},${center.longitude})["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["name"];out center ${MAX_RESULTS};`;
    const data = await this.timed('overpass', () =>
      this.json(overpass, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({ data: query }),
      }),
    );
    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray((data as { elements?: unknown }).elements)
    ) {
      throw new BadGatewayException('The restaurant data service returned an invalid response.');
    }
    if (typeof (data as { remark?: unknown }).remark === 'string') {
      throw new BadGatewayException('The restaurant data service could not complete the search.');
    }
    const elements = (data as { elements: OsmElement[] }).elements;
    const listings = elements
      .slice(0, MAX_RESULTS)
      .map(listing)
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    await this.timed('database upsert', () =>
      this.prisma.$transaction(
        listings.map(entry =>
          this.prisma.discoveredRestaurant.upsert({
            where: { id: entry.id },
            create: entry,
            update: entry,
          }),
        ),
      ),
    );
    return {
      center,
      restaurants: await this.timed('database nearby', () => this.findNearby(center)),
      limited: elements.length >= MAX_RESULTS,
    };
  }

  private async geocode(location: string, radiusMiles: number, geocoder: string): Promise<Point> {
    const url = new URL(geocoder);
    const isZip = /^\d{5}(?:-\d{4})?$/.test(location);
    if (isZip) {
      url.searchParams.set('postalcode', location);
    } else {
      url.searchParams.set('q', location);
    }
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('countrycodes', 'us');
    url.searchParams.set('limit', '1');
    const result = await this.json(url.toString(), { headers: { Accept: 'application/json' } });
    if (!Array.isArray(result)) {
      throw new BadGatewayException('The location service returned an invalid response.');
    }
    const postalCode = result[0]?.address?.postcode;
    if (
      isZip &&
      (!result.length ||
        typeof postalCode !== 'string' ||
        !new RegExp(`^${location.slice(0, 5)}(?:-\\d{4})?$`).test(postalCode))
    ) {
      return this.timed('ZIP fallback', () => this.geocodeZip(location, radiusMiles));
    }
    if (!result.length) {
      throw new BadRequestException(
        'No US location found. Try a more specific address, city and state, or ZIP code.',
      );
    }
    const place = result[0];
    if (place?.address?.country_code?.toLowerCase() !== 'us') {
      throw new BadRequestException('Please select a location in the United States.');
    }
    if (
      typeof place.lat !== 'string' ||
      typeof place.lon !== 'string' ||
      !place.lat.trim() ||
      !place.lon.trim()
    ) {
      throw new BadGatewayException('The location service returned invalid coordinates.');
    }
    return point({
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      radiusMiles,
    });
  }

  private async geocodeZip(location: string, radiusMiles: number): Promise<Point> {
    const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'The location service could not find this ZIP code. Set GEOAPIFY_API_KEY to enable ZIP fallback.',
      );
    }
    const zip = location.slice(0, 5);
    const url = new URL('https://api.geoapify.com/v1/geocode/search');
    url.searchParams.set('postcode', zip);
    url.searchParams.set('country', 'United States');
    url.searchParams.set('filter', 'countrycode:us');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('apiKey', apiKey);
    const result = await this.json(url.toString(), { headers: { Accept: 'application/json' } });
    if (
      !result ||
      typeof result !== 'object' ||
      !Array.isArray((result as { results?: unknown }).results)
    ) {
      throw new BadGatewayException('The ZIP lookup service returned an invalid response.');
    }
    const matches = (result as { results: unknown[] }).results.filter(entry => {
      if (!entry || typeof entry !== 'object') return false;
      const place = entry as { postcode?: unknown; country_code?: unknown };
      return (
        typeof place.country_code === 'string' &&
        place.country_code.toLowerCase() === 'us' &&
        place.postcode === zip
      );
    });
    if (!matches.length) {
      throw new BadRequestException('No US location found for this ZIP code.');
    }
    const place = matches[0] as { lat?: unknown; lon?: unknown };
    if (
      typeof place.lat !== 'number' ||
      !Number.isFinite(place.lat) ||
      place.lat < -90 ||
      place.lat > 90 ||
      typeof place.lon !== 'number' ||
      !Number.isFinite(place.lon) ||
      place.lon < -180 ||
      place.lon > 180
    ) {
      throw new BadGatewayException('The ZIP lookup service returned invalid coordinates.');
    }
    return { latitude: place.lat, longitude: place.lon, radiusMiles };
  }

  async saved(input: unknown) {
    const center = point(input);
    return { restaurants: await this.findNearby(center) };
  }

  private async findNearby(center: Point) {
    const latDelta = center.radiusMiles / 68.7;
    const maxLatitude = Math.min(90, Math.abs(center.latitude) + latDelta);
    const cosLat = Math.cos((maxLatitude * Math.PI) / 180);
    const lonDelta = cosLat < 0.001 ? 180 : Math.min(180, center.radiusMiles / (68.7 * cosLat));
    const restaurants = await this.prisma.discoveredRestaurant.findMany({
      where: {
        latitude: { gte: center.latitude - latDelta, lte: center.latitude + latDelta },
        ...(center.longitude - lonDelta >= -180 && center.longitude + lonDelta <= 180
          ? { longitude: { gte: center.longitude - lonDelta, lte: center.longitude + lonDelta } }
          : {}),
      },
    });
    return restaurants
      .map(restaurant => ({
        ...restaurant,
        distanceMiles: distanceMiles(center, restaurant.latitude, restaurant.longitude),
      }))
      .filter(restaurant => restaurant.distanceMiles <= center.radiusMiles)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
  }
}
