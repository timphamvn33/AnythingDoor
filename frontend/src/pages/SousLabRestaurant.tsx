import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import RestaurantThumbnail from '@/components/shared/RestaurantThumbnail';
import SousLabUsage from '@/components/shared/SousLabUsage';
import { Button } from '@/components/ui/button';
import { addDemoCartItem } from '@/data/demo-restaurants';
import {
  getSousLabMenu,
  getSousLabRestaurant,
  type SousLabItem,
  type SousLabMenu,
  type SousLabRestaurantDetails,
} from '@/services/souslab.service';

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Unable to load SousLab data. Please try again.';
}

export default function SousLabRestaurantPage() {
  const { restaurantId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<SousLabRestaurantDetails | null>(null);
  const [menu, setMenu] = useState<SousLabMenu | null>(null);
  const [restaurantError, setRestaurantError] = useState('');
  const [menuError, setMenuError] = useState('');
  const [cartError, setCartError] = useState('');
  const [status, setStatus] = useState('');
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setRestaurant(null);
    setMenu(null);
    setRestaurantError('');
    setMenuError('');
    setCartError('');
    setStatus('');
    setLoadingRestaurant(true);
    setLoadingMenu(true);

    void getSousLabRestaurant(restaurantId)
      .then(result => {
        if (active) setRestaurant(result);
      })
      .catch(error => {
        if (active) setRestaurantError(message(error));
      })
      .finally(() => {
        if (active) setLoadingRestaurant(false);
      });
    void getSousLabMenu(restaurantId)
      .then(result => {
        if (active) setMenu(result);
      })
      .catch(error => {
        if (active) setMenuError(message(error));
      })
      .finally(() => {
        if (active) setLoadingMenu(false);
      });
    return () => {
      active = false;
    };
  }, [restaurantId, retry]);

  const addItem = (item: SousLabItem) => {
    if (
      !restaurant ||
      item.price === null ||
      item.outOfStock === true ||
      !['USD', '$'].includes(item.currency ?? '')
    )
      return;
    setCartError('');
    try {
      addDemoCartItem(
        {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          available: false,
          category: [],
          imgUrl: '',
          restaurantId: `souslab-${restaurant.id}`,
        },
        1,
        [restaurant.name || 'Restaurant', restaurant.address].filter(Boolean).join(' — '),
      );
      setStatus(`${item.name} added to the sample cart.`);
    } catch {
      setCartError('Unable to save the sample cart in this browser.');
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <Button
          variant="outline"
          onClick={() => (location.state?.fromSouslabSearch ? navigate(-1) : navigate('/landing'))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to restaurants
        </Button>

        <SousLabUsage />

        {loadingRestaurant && <p role="status">Loading restaurant details…</p>}
        {restaurantError && (
          <p role="alert" className="text-sm text-red-700">
            {restaurantError}
          </p>
        )}
        {restaurant && (
          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <RestaurantThumbnail categories={restaurant.cuisines} />
            <div className="space-y-2 p-5">
              <h1 className="text-3xl font-semibold">
                {restaurant.name || 'Restaurant name unavailable'}
              </h1>
              <p>{restaurant.address || 'Address unavailable'}</p>
              {restaurant.cuisines.length > 0 && <p>{restaurant.cuisines.join(' · ')}</p>}
              {restaurant.description && <p className="text-gray-700">{restaurant.description}</p>}
              {restaurant.phone && <p>Phone: {restaurant.phone}</p>}
              {restaurant.status && (
                <p className="text-sm text-gray-600">Listing status: {restaurant.status}</p>
              )}
              {restaurant.lastSeen && (
                <p className="text-sm text-gray-600">Last seen: {restaurant.lastSeen}</p>
              )}
            </div>
          </section>
        )}

        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          SousLab data is refreshed weekly and may be incomplete or outdated. Prices and
          availability are not guaranteed. Options and modifiers are not supported. The sample cart
          does not place an order with the restaurant.
        </p>

        <section className="space-y-4" aria-labelledby="souslab-menu-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="souslab-menu-heading" className="text-2xl font-semibold">
              Menu
            </h2>
            <Button type="button" onClick={() => navigate('/landing/cart')}>
              View sample cart
            </Button>
          </div>
          {loadingMenu && <p role="status">Loading menu…</p>}
          {menuError && (
            <p role="alert" className="text-sm text-red-700">
              {menuError}
            </p>
          )}
          {cartError && (
            <p role="alert" className="text-sm text-red-700">
              {cartError}
            </p>
          )}
          {status && (
            <p role="status" className="text-sm text-green-700">
              {status}
            </p>
          )}
          {menu && menu.groups.length === 0 && (
            <p>No menu items are available from SousLab for this location.</p>
          )}
          {menu?.groups.map((group, index) => (
            <section key={`${group.name}-${index}`} className="space-y-2">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <ul className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <li
                    key={`${item.id}-${itemIndex}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm">
                        {item.price === null
                          ? 'Price unavailable'
                          : item.currency === 'USD' || item.currency === '$'
                            ? `$${item.price.toFixed(2)}`
                            : `${item.price.toFixed(2)} (${item.currency || 'currency not provided'})`}
                      </p>
                      {item.price !== null && item.currency !== 'USD' && item.currency !== '$' && (
                        <p className="text-xs text-gray-600">
                          Only USD prices can be added to the sample cart.
                        </p>
                      )}
                      {item.outOfStock === true && (
                        <p className="text-xs text-gray-600">Listed as out of stock.</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        !restaurant ||
                        item.price === null ||
                        item.outOfStock === true ||
                        !['USD', '$'].includes(item.currency ?? '')
                      }
                      onClick={() => addItem(item)}
                    >
                      Add to sample cart
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
        {(restaurantError || menuError) && (
          <Button type="button" variant="outline" onClick={() => setRetry(value => value + 1)}>
            Retry loading
          </Button>
        )}
        <p className="text-xs text-gray-600">
          Restaurant and menu data from{' '}
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
      </main>
    </PageWrapper>
  );
}
