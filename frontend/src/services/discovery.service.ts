import api from '@/api/axios';

export interface DiscoveryCenter {
  latitude: number;
  longitude: number;
  radiusMiles: number;
}

export interface LocationSuggestion {
  label: string;
  token?: string;
}

export interface DiscoveredRestaurant {
  id: string;
  name: string;
  category: string[];
  address: string | null;
  website: string | null;
  distanceMiles: number;
}

export async function discoverRestaurants(
  location: string,
  radiusMiles: number,
  suggestionToken?: string,
) {
  const response = await api.post<{
    center: DiscoveryCenter;
    restaurants: DiscoveredRestaurant[];
    limited: boolean;
    cached: boolean;
  }>('discovery/search', { location, radiusMiles, suggestionToken });
  return response.data;
}

export async function getSavedRestaurants(center: DiscoveryCenter) {
  const response = await api.post<{ restaurants: DiscoveredRestaurant[] }>(
    'discovery/saved',
    center,
  );
  return response.data;
}

export async function getLocationSuggestions(query: string, signal?: AbortSignal) {
  const response = await api.get<{ suggestions: string[]; places?: LocationSuggestion[] }>(
    'discovery/suggestions',
    {
      params: { q: query },
      signal,
    },
  );
  return response.data.places ?? response.data.suggestions.map(label => ({ label }));
}
