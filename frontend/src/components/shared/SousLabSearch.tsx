import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { getCurrentLocation } from '@/services/location.service';
import { searchSousLab, type SousLabRestaurant } from '@/services/souslab.service';
import { categoryMatches } from '@/utils/category';
import SousLabUsage from '@/components/shared/SousLabUsage';

interface SearchSnapshot {
  zip: string;
  name: string;
  restaurants: SousLabRestaurant[];
  nextCursor: string | null;
  lastSearch: { zip: string; name: string } | null;
  searched: boolean;
}

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Unable to load SousLab data. Please try again.';
}

export default function SousLabSearch({
  selectedCategory,
  query,
}: {
  selectedCategory: string;
  query: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = (location.state as { souslabSnapshot?: SearchSnapshot } | null)?.souslabSnapshot;
  const [zip, setZip] = useState(() => {
    if (snapshot) return snapshot.zip;
    const location = getCurrentLocation().trim();
    return /^\d{5}(?:-\d{4})?$/.test(location) ? location : '';
  });
  const [name, setName] = useState(snapshot?.name ?? '');
  const [restaurants, setRestaurants] = useState<SousLabRestaurant[]>(snapshot?.restaurants ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(snapshot?.nextCursor ?? null);
  const [lastSearch, setLastSearch] = useState<{ zip: string; name: string } | null>(
    snapshot?.lastSearch ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(snapshot?.searched ?? false);
  const [error, setError] = useState('');
  const visible = restaurants.filter(
    restaurant =>
      categoryMatches(restaurant.cuisines ?? [], selectedCategory) &&
      `${restaurant.name} ${(restaurant.cuisines ?? []).join(' ')} ${restaurant.address}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  const search = async () => {
    setError('');
    if (!/^\d{5}(?:-\d{4})?$/.test(zip.trim())) {
      setError('Enter a US ZIP code (five digits or ZIP+4).');
      return;
    }
    setLoading(true);
    setRestaurants([]);
    setNextCursor(null);
    setLastSearch(null);
    setSearched(false);
    try {
      const criteria = { zip: zip.trim(), name: name.trim() };
      const result = await searchSousLab(criteria.zip, criteria.name);
      setRestaurants(result.restaurants);
      setNextCursor(result.nextCursor);
      setLastSearch(criteria);
      setSearched(true);
    } catch (caught) {
      setError(message(caught));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastSearch || !nextCursor) return;
    setLoading(true);
    setError('');
    try {
      const result = await searchSousLab(lastSearch.zip, lastSearch.name, nextCursor);
      setRestaurants(previous => [...previous, ...result.restaurants]);
      setNextCursor(result.nextCursor);
    } catch (caught) {
      setError(message(caught));
    } finally {
      setLoading(false);
    }
  };

  const showMenu = (restaurant: SousLabRestaurant) => {
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {
        ...location.state,
        souslabSnapshot: { zip, name, restaurants, nextCursor, lastSearch, searched },
      },
    });
    navigate(`/landing/souslab/${encodeURIComponent(restaurant.id)}`, {
      state: { fromSouslabSearch: true },
    });
  };

  return (
    <section className="mt-10 space-y-4 rounded-xl border p-4" aria-labelledby="souslab-heading">
      <h2 id="souslab-heading" className="text-2xl font-semibold">
        Search SousLab menus
      </h2>
      <SousLabUsage />
      <p className="text-sm text-gray-600">
        Search by exact ZIP or ZIP+4 and select the location. A five-digit ZIP may not find listings
        stored with ZIP+4. SousLab listings are separate from the mapped restaurants above. Data is
        refreshed weekly and may be incomplete or outdated. Prices and availability are not
        guaranteed; options and modifiers are not supported. Items go to a sample cart only, not to
        the restaurant.
      </p>
      <p className="text-sm text-gray-600">
        The category tabs and filter box apply to loaded restaurants by name, reported cuisine, or
        address, not menu items. Listings without cuisine information appear only under All;
        more matches may be on later pages.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={event => {
          event.preventDefault();
          void search();
        }}
      >
        <label className="text-sm">
          US ZIP code
          <input
            className="ml-2 w-28 rounded border px-2 py-1"
            value={zip}
            maxLength={10}
            onChange={event => setZip(event.target.value)}
          />
        </label>
        <label className="text-sm">
          Restaurant name (optional)
          <input
            className="ml-2 rounded border px-2 py-1"
            value={name}
            maxLength={100}
            onChange={event => setName(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={loading}>
          Search menus
        </Button>
      </form>
      {loading && <p role="status">Loading SousLab data…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {searched && restaurants.length === 0 && <p>No SousLab restaurants found for this search.</p>}
      {searched && restaurants.length > 0 && visible.length === 0 && (
        <p>No loaded SousLab restaurants match the current filters.</p>
      )}
      {restaurants.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            Coverage may be incomplete. Loading results and menus uses your SousLab record quota.
          </p>
          <ul className="space-y-2">
            {visible.map((restaurant, index) => (
              <li
                key={`${restaurant.id}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
              >
                <div>
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-sm text-gray-600">
                    {(restaurant.cuisines ?? []).join(' · ') || 'Category not available'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {restaurant.address || 'Address unavailable'}
                  </p>
                  {restaurant.status && (
                    <p className="text-xs text-gray-600">Listing status: {restaurant.status}</p>
                  )}
                  {restaurant.itemCount !== null && (
                    <p className="text-xs text-gray-600">
                      Menu may use {restaurant.itemCount} records.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => showMenu(restaurant)}
                >
                  View menu
                </Button>
              </li>
            ))}
          </ul>
          {nextCursor && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void loadMore()}
            >
              Load more restaurants
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-gray-600">
        Menu data from{' '}
        <a
          className="underline"
          href="https://souslab.site/"
          target="_blank"
          rel="noopener noreferrer"
        >
          SousLab
        </a>
        .
      </p>
    </section>
  );
}
