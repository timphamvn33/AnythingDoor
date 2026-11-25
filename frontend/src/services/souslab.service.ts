import api from '@/api/axios';

export interface SousLabUsage {
  limit: number;
  remaining: number;
  resetAt: number | null;
  observedAt: string;
}

export async function getSousLabUsage() {
  const response = await api.get<{ usage: SousLabUsage | null }>('souslab/usage');
  return response.data.usage;
}

export interface SousLabRestaurant {
  id: string;
  name: string;
  address: string;
  cuisines: string[];
  itemCount: number | null;
  status: string | null;
}

export interface SousLabItem {
  id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string | null;
  outOfStock: boolean | null;
}

export interface SousLabMenu {
  groups: { name: string; items: SousLabItem[] }[];
}

export interface SousLabRestaurantDetails {
  id: string;
  name: string;
  address: string;
  description: string;
  phone: string;
  cuisines: string[];
  status: string;
  lastSeen: string;
}

export async function searchSousLab(zip: string, name: string, cursor?: string) {
  const response = await api.get<{ restaurants: SousLabRestaurant[]; nextCursor: string | null }>(
    'souslab/restaurants',
    {
      params: { zip, name, cursor },
    },
  );
  return response.data;
}

export async function getSousLabMenu(id: string) {
  const response = await api.get<SousLabMenu>('souslab/menu', { params: { id } });
  return response.data;
}

export async function getSousLabRestaurant(id: string) {
  const response = await api.get<SousLabRestaurantDetails>('souslab/restaurant', {
    params: { id },
  });
  return response.data;
}
