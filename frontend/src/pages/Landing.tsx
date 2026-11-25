'use client';

import { useEffect, useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getAllItem } from '@/services/item.service';
import ItemInfo from '@/components/shared/ItemInfo';
import type { ItemPayload } from '@/schemas/item.schema';
import DialogOrderItem from '@/components/dialog/DialogOrderItem';
import { initOrAddItem } from '@/services/order.service';
import { useAuth } from '@/context/auth.context';
import { useCart } from '@/context/cart.context';
import RestaurantDiscovery from '@/components/shared/RestaurantDiscovery';
import SousLabSearch from '@/components/shared/SousLabSearch';
import CategoryNavigation from '@/components/shared/CategoryNavigation';

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const location = useLocation();
  const [items, setItems] = useState<ItemPayload[]>([]);
  const [openDialogOrderItem, setOpenDialogOrderItem] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ItemPayload | null>(null);
  const { user } = useAuth();
  const { refreshCount } = useCart();
  useEffect(() => {
    const toastMsg = location.state?.toastMessage;
    if (toastMsg) {
      toast.success(toastMsg);
    }
    getAllMenuItems();
  }, []);

  const getAllMenuItems = async () => {
    try {
      const res = await getAllItem();
      const fetchItems = res?.data as ItemPayload[];
      setItems(fetchItems);
    } catch (error: any) {
      toast.error(`Unable to get all menu item: ` + error);
    }
  };

  const navigate = useNavigate();

  const handleClickOnItem = (item: ItemPayload) => {
    if (item.restaurantId) {
      navigate(`/landing/store/${item.restaurantId}`);
    }
  };

  const handleAddItemToCart = (item: ItemPayload) => {
    setOpenDialogOrderItem(true);
    setSelectedItem(item);
  };

  const addToCart = async (orderData: {
    itemId: string;
    quantity: number;
    note?: string;
    totalPrice: number;
  }) => {
    const userId = user?.id;
    const itemAdd = {
      orderId: '',
      menuItemId: orderData.itemId,
      quantity: orderData.quantity,
      price: orderData.totalPrice,
    };

    try {
      await initOrAddItem(userId!, itemAdd);
      refreshCount();
    } catch (error: any) {
      toast.error('unable to get the order');
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <Toaster position="top-center" richColors />
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        orientation="vertical"
        className="h-[calc(100vh-64px)] flex-row gap-0"
      >
        <CategoryNavigation />
        <main className="min-w-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            <div className="sticky top-0 bg-white z-10 pb-4">
              <div className="grid grid-cols-1 gap-2 mb-2 sm:grid-cols-2">
                <Input
                  type="text"
                  placeholder="Filter by restaurant, cuisine, or item"
                  value={searchText}
                  onChange={event => setSearchText(event.target.value)}
                  aria-label="Filter results"
                  className="bg-white border border-gray-300 focus:border-black focus:ring-0 rounded-xl px-4 py-2 text-base pl-10"
                />
              </div>

              <div className="text-gray-700 text-lg font-medium">
                Showing results for:{' '}
                <span className="text-black">
                  {selectedCategory === 'Coffe'
                    ? 'Coffee'
                    : selectedCategory === 'Desert'
                      ? 'Dessert'
                      : selectedCategory}
                </span>
              </div>
            </div>

            <RestaurantDiscovery
              selectedCategory={selectedCategory}
              query={searchText}
              initialSearchLocation={
                typeof location.state?.discoveryLocation === 'string'
                  ? location.state.discoveryLocation
                  : undefined
              }
              initialSuggestionToken={
                typeof location.state?.discoverySuggestionToken === 'string'
                  ? location.state.discoverySuggestionToken
                  : undefined
              }
            />

            <SousLabSearch selectedCategory={selectedCategory} query={searchText} />

            <details className="mt-10">
              <summary className="cursor-pointer text-lg font-semibold">
                Partner menu items (not location-filtered)
              </summary>
              <section className="mt-10">
                <h2 className="mb-4 text-2xl font-semibold">Menu items from restaurants</h2>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items
                    .filter(
                      item =>
                        `${item.name} ${item.category.join(' ')}`
                          .toLowerCase()
                          .includes(searchText.trim().toLowerCase()) &&
                        (selectedCategory === 'All' || item.category.includes(selectedCategory)),
                    )
                    .map(item => (
                      <ItemInfo
                        key={item.id}
                        item={item}
                        isReadOnly={true}
                        onClick={() => handleClickOnItem(item)}
                        handleAddItemToCart={handleAddItemToCart}
                      />
                    ))}
                </div>
              </section>
            </details>
            {selectedItem && (
              <DialogOrderItem
                open={openDialogOrderItem}
                onClose={() => {
                  setOpenDialogOrderItem(false);
                  setSelectedItem(null);
                }}
                item={selectedItem}
                onAddtoCart={addToCart}
              />
            )}
          </div>
        </main>
      </Tabs>
    </PageWrapper>
  );
}
