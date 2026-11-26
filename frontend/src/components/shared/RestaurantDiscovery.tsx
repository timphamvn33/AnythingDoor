import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';
import RestaurantPhoto from '@/components/shared/RestaurantPhoto';
import {
  discoverRestaurants,
  getSavedRestaurants,
  type DiscoveryCenter,
  type DiscoveredRestaurant,
  type LocationSuggestion,
} from '@/services/discovery.service';
import { getCurrentLocation, setCurrentLocation } from '@/services/location.service';
import { categoryMatches } from '@/utils/category';

const CENTER_KEY = 'anythingdoor-discovery-centers';
const DEFAULT_RESULTS_PER_PAGE = 12;

function readCenters(): Record<string, DiscoveryCenter> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(CENTER_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? (saved as Record<string, DiscoveryCenter>)
      : {};
  } catch {
    return {};
  }
}

export default function RestaurantDiscovery({
  selectedCategory,
  query,
  initialSearchLocation,
  initialSuggestionToken,
}: {
  selectedCategory: string;
  query: string;
  initialSearchLocation?: string;
  initialSuggestionToken?: string;
}) {
  const [location, setLocation] = useState(getCurrentLocation);
  const [distance, setDistance] = useState('');
  const [restaurants, setRestaurants] = useState<DiscoveredRestaurant[]>([]);
  const [searchedLocation, setSearchedLocation] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState<number | 'all'>(DEFAULT_RESULTS_PER_PAGE);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const lastSearch = useRef<{ location: string; radiusMiles: number } | null>(null);
  const radiusRefreshTimer = useRef<number | null>(null);
  const initialSearchStarted = useRef(false);

  const search = useCallback(
    async (
      savedOnly: boolean,
      searchLocation = location,
      suggestionToken = selectedLocation?.label === searchLocation.trim()
        ? selectedLocation.token
        : undefined,
    ) => {
      if (radiusRefreshTimer.current !== null) {
        window.clearTimeout(radiusRefreshTimer.current);
        radiusRefreshTimer.current = null;
      }
      const trimmed = searchLocation.trim();
      const radiusMiles = distance.trim() ? Number(distance) : 5;
      if (trimmed.length < 3 || trimmed.length > 200) {
        setError('Enter a US address, city and state, or ZIP code.');
        return;
      }
      if (!Number.isFinite(radiusMiles) || radiusMiles < 1 || radiusMiles > 25) {
        setError('Distance must be between 1 and 25 miles.');
        return;
      }
      setLoading(true);
      setError('');
      setStatus('');
      setRestaurants([]);
      setSearchedLocation('');
      setCurrentPage(1);
      try {
        const key = trimmed.toLowerCase();
        const centers = readCenters();
        if (savedOnly) {
          const center = centers[key];
          if (!center) {
            setError(
              'No saved location on this browser. Run a live search for this location first.',
            );
            return;
          }
          const result = await getSavedRestaurants({ ...center, radiusMiles });
          setRestaurants(result.restaurants);
          setStatus('Showing previously saved listings. They may be out of date.');
        } else {
          const result = await discoverRestaurants(trimmed, radiusMiles, suggestionToken);
          centers[key] = result.center;
          localStorage.setItem(CENTER_KEY, JSON.stringify(centers));
          setRestaurants(result.restaurants);
          setStatus(
            `${result.cached ? 'Showing a recent cached search. ' : ''}${
              result.limited
                ? 'The provider limited this search to 500 mapped places; try a smaller distance for more complete results.'
                : 'Showing mapped restaurants and previously saved listings. Coverage may be incomplete.'
            }`,
          );
        }
        lastSearch.current = { location: trimmed, radiusMiles };
        setCurrentLocation(trimmed);
        setSearchedLocation(trimmed);
      } catch (caught) {
        const message =
          axios.isAxiosError(caught) && typeof caught.response?.data?.message === 'string'
            ? caught.response.data.message
            : 'Unable to search restaurants. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [distance, location, selectedLocation],
  );

  useEffect(() => {
    const previous = lastSearch.current;
    const radiusMiles = distance.trim() ? Number(distance) : 5;
    if (
      !previous ||
      location.trim().toLowerCase() !== previous.location.toLowerCase() ||
      !Number.isFinite(radiusMiles) ||
      radiusMiles < 1 ||
      radiusMiles > 25 ||
      radiusMiles === previous.radiusMiles
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      radiusRefreshTimer.current = null;
      void search(false, previous.location);
    }, 650);
    radiusRefreshTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (radiusRefreshTimer.current === timer) radiusRefreshTimer.current = null;
    };
  }, [distance, location, search]);

  useEffect(() => {
    if (!initialSearchLocation || initialSearchStarted.current) return;
    initialSearchStarted.current = true;
    setLocation(initialSearchLocation);
    if (initialSuggestionToken) {
      setSelectedLocation({ label: initialSearchLocation, token: initialSuggestionToken });
    }
    void search(false, initialSearchLocation, initialSuggestionToken);
  }, [initialSearchLocation, initialSuggestionToken, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, query, restaurants, searchedLocation]);

  const visible = restaurants.filter(
    restaurant =>
      categoryMatches(restaurant.category, selectedCategory) &&
      `${restaurant.name} ${restaurant.category.join(' ')} ${restaurant.address ?? ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const pageCount = resultsPerPage === 'all' ? 1 : Math.ceil(visible.length / resultsPerPage);
  const displayedPage = Math.min(currentPage, Math.max(1, pageCount));
  const pageRestaurants =
    resultsPerPage === 'all'
      ? visible
      : visible.slice((displayedPage - 1) * resultsPerPage, displayedPage * resultsPerPage);
  return (
    <section className="@container mt-6 space-y-4" aria-labelledby="discovery-heading">
      <div>
        <h2 id="discovery-heading" className="text-2xl font-semibold">
          Discover nearby restaurants
        </h2>
        <p className="text-sm text-gray-600">
          Search a US address, city and state, or ZIP. Typing sends your partial input to Geoapify
          for suggestions; live search sends coordinates to the restaurant data provider and may
          send the location to the configured geocoder. Use a city or ZIP instead of a street
          address if you prefer.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        noValidate
        onSubmit={event => {
          event.preventDefault();
          void search(false);
        }}
      >
        <div className="relative w-full max-w-md">
          <LocationAutocomplete
            id="discovery-location"
            value={location}
            onChange={value => {
              setLocation(value);
              setSelectedLocation(null);
            }}
            onSelect={setSelectedLocation}
            inputClassName="w-full"
            placeholder="City, state, address, or ZIP"
          />
        </div>
        <div className="w-36">
          <label htmlFor="discovery-distance" className="mb-1 block text-sm font-medium">
            Distance (miles)
          </label>
          <Input
            id="discovery-distance"
            type="number"
            min={1}
            max={25}
            step="any"
            value={distance}
            onChange={event => setDistance(event.target.value)}
            placeholder="5"
          />
        </div>
        <Button type="submit" disabled={loading}>
          Search live
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void search(true)}
        >
          Search saved
        </Button>
      </form>
      <p className="text-sm text-gray-600">
        Distance defaults to 5 miles. Changing the 1–25 mile radius automatically refreshes the last
        search and may contact the live providers.
      </p>
      {loading && <p role="status">Searching restaurants…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-gray-600">
          {status}
        </p>
      )}
      {searchedLocation && (
        <p className="text-sm text-gray-600" aria-live="polite">
          {visible.length} results near {searchedLocation}
          {pageCount > 1 && ` · Page ${displayedPage} of ${pageCount}`}. Distance is approximate,
          not a delivery area.
        </p>
      )}
      {searchedLocation && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="discovery-page-size">Restaurants per page</label>
          <select
            id="discovery-page-size"
            className="rounded-md border bg-white px-2 py-1"
            value={resultsPerPage}
            onChange={event => {
              const value = event.target.value;
              setResultsPerPage(value === 'all' ? 'all' : Number(value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="all">All</option>
          </select>
        </div>
      )}
      {searchedLocation && visible.length === 0 && (
        <p className="rounded-lg bg-gray-50 p-4 text-sm">
          No listings match this search and filters.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 @min-[22rem]:grid-cols-2 @min-[38rem]:grid-cols-3 @min-[54rem]:grid-cols-6">
        {pageRestaurants.map(restaurant => (
          <article
            key={restaurant.id}
            className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm [overflow-wrap:anywhere]"
          >
            <RestaurantPhoto
              source="discovery"
              id={restaurant.id}
              name={restaurant.name}
              categories={restaurant.category}
            />
            <div className="p-3">
              <h3 className="text-lg font-semibold">{restaurant.name}</h3>
              <p className="text-sm text-gray-600">
                {restaurant.category.join(' · ') || 'Category not available'}
              </p>
              <p className="text-sm text-gray-600">
                {restaurant.address || 'Street address not available'}
              </p>
              <p className="text-sm text-gray-600">
                {restaurant.distanceMiles.toFixed(1)} miles away
              </p>
              <p className="mt-2 text-sm">Discovery only — menu and ordering unavailable.</p>
              {restaurant.website && (
                <a
                  className="text-sm font-medium underline"
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Restaurant website
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Restaurant result pages"
        >
          <Button
            type="button"
            variant="outline"
            disabled={displayedPage === 1}
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
            <Button
              key={page}
              type="button"
              size="sm"
              variant={page === displayedPage ? 'default' : 'outline'}
              aria-label={`Page ${page}`}
              aria-current={page === displayedPage ? 'page' : undefined}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={displayedPage === pageCount}
            onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))}
          >
            Next
          </Button>
        </nav>
      )}
      <p className="text-xs text-gray-600">
        Restaurant data ©{' '}
        <a
          className="underline"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap contributors
        </a>
        .
      </p>
    </section>
  );
}
