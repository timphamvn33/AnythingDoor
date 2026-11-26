import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { SousLabService } from '@src/souslab/souslab.service';
import { reserveGooglePlaceRequest } from './place-photos.persistence';

type JsonObject = Record<string, unknown>;
class MonthlyLimitReached extends Error {}
type Attribution = { name: string; uri: string | null; photoUri: string | null };
type Listing = {
  name: string;
  address: string | null;
  location?: { latitude: number; longitude: number };
};
type PhotoResult =
  | { status: 'disabled' | 'not-found' | 'limit-reached' }
  | { status: 'available'; url: string; googleMapsUri: string; attributions: Attribution[] };

function object(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}

function normalized(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function distanceMeters(a: { latitude: number; longitude: number }, b: JsonObject): number {
  if (typeof b.latitude !== 'number' || typeof b.longitude !== 'number') return Infinity;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function matches(listing: Listing, place: JsonObject): boolean {
  const name = object(place.displayName)?.text;
  if (typeof name !== 'string' || normalized(name) !== normalized(listing.name)) return false;
  if (listing.location) {
    const location = object(place.location);
    return location !== null && distanceMeters(listing.location, location) <= 80;
  }
  if (!listing.address || typeof place.formattedAddress !== 'string') return false;
  const expected = normalized(listing.address);
  const actual = normalized(place.formattedAddress).replace(/ (united states|usa|us)$/, '');
  return actual === expected;
}

function attributions(value: unknown, nameKey: string, uriKey: string): Attribution[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    const item = object(entry);
    const name = item?.[nameKey];
    if (typeof name !== 'string' || !name.trim()) return [];
    const photoUri = safeLink(item?.photoUri);
    return [
      {
        name: name.trim(),
        uri: safeLink(item?.[uriKey]),
        photoUri:
          photoUri && new URL(photoUri).hostname.endsWith('.googleusercontent.com')
            ? photoUri
            : null,
      },
    ];
  });
}

@Injectable()
export class PlacePhotosService {
  private readonly logger = new Logger(PlacePhotosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sousLab: SousLabService,
  ) {}

  private async listing(source: string, id: string): Promise<Listing | null> {
    if (source === 'discovery') {
      if (!/^(node|way|relation)\/\d{1,20}$/.test(id)) {
        throw new BadRequestException('Invalid discovery restaurant ID.');
      }
      const row = await this.prisma.discoveredRestaurant.findUnique({ where: { id } });
      if (!row) throw new NotFoundException('Restaurant not found.');
      return {
        name: row.name,
        address: row.address,
        location: { latitude: row.latitude, longitude: row.longitude },
      };
    }
    if (source === 'souslab') {
      const row = await this.sousLab.restaurant(id);
      if (!row.name || !/^\d/.test(row.address) || !/\b\d{5}(?:-\d{4})?\b/.test(row.address)) {
        return null;
      }
      return { name: row.name, address: row.address };
    }
    throw new BadRequestException('Invalid photo source.');
  }

  private async google(url: string, key: string, options: RequestInit): Promise<JsonObject> {
    if (!(await reserveGooglePlaceRequest(this.prisma))) throw new MonthlyLimitReached();
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: { ...options.headers, 'X-Goog-Api-Key': key },
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
    } catch {
      throw new BadGatewayException('Google Places could not be reached.');
    }
    if (!response.ok) {
      this.logger.warn(`Google Places request failed with status ${response.status}.`);
      throw new BadGatewayException('Google Places could not provide a photo.');
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new BadGatewayException('Google Places returned an invalid response.');
    }
    const result = object(body);
    if (!result) throw new BadGatewayException('Google Places returned an invalid response.');
    return result;
  }

  async photo(source: string, id: string): Promise<PhotoResult> {
    const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!key) return { status: 'disabled' };
    const listing = await this.listing(source, id);
    if (!listing) return { status: 'not-found' };
    try {
      const result = await this.google('https://places.googleapis.com/v1/places:searchText', key, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.location,places.photos,places.attributions',
        },
        body: JSON.stringify({
          textQuery: [listing.name, listing.address].filter(Boolean).join(' '),
          regionCode: 'US',
          languageCode: 'en',
          maxResultCount: 5,
          ...(listing.location && {
            locationBias: { circle: { center: listing.location, radius: 500 } },
          }),
        }),
      });
      if (result.places !== undefined && !Array.isArray(result.places)) {
        throw new BadGatewayException('Google Places returned an invalid restaurant list.');
      }
      const matched = (Array.isArray(result.places) ? result.places : [])
        .map(object)
        .filter((place): place is JsonObject => place !== null && matches(listing, place));
      if (matched.length !== 1) return { status: 'not-found' };
      const place = matched[0];
      const photo = Array.isArray(place.photos) ? object(place.photos[0]) : null;
      if (!photo) return { status: 'not-found' };
      const googleMapsUri = safeLink(photo.googleMapsUri);
      if (!googleMapsUri) return { status: 'not-found' };
      if (
        typeof photo.name !== 'string' ||
        !/^places\/[a-z0-9_-]+\/photos\/[a-z0-9_-]+$/i.test(photo.name)
      ) {
        throw new BadGatewayException('Google Places returned an invalid photo reference.');
      }
      const media = await this.google(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
        key,
        { method: 'GET' },
      );
      const url = safeLink(media.photoUri);
      if (!url || !new URL(url).hostname.endsWith('.googleusercontent.com')) {
        throw new BadGatewayException('Google Places returned an invalid photo URL.');
      }
      return {
        status: 'available',
        url,
        googleMapsUri,
        attributions: [
          ...attributions(photo.authorAttributions, 'displayName', 'uri'),
          ...attributions(place.attributions, 'provider', 'providerUri'),
        ],
      };
    } catch (error) {
      if (error instanceof MonthlyLimitReached) return { status: 'limit-reached' };
      throw error;
    }
  }
}
