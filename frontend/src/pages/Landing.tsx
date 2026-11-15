'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/SideNavbar';
import { ArrowLeftRight } from 'lucide-react';
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

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches,
  );
  const [distance, setDistance] = useState('');
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [price, setPrice] = useState('$');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
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

  const resetFilters = () => {
    setDistance('');
    setCheckedCategories([]);
    setPrice('$');
  };

  const handleCategoryCheck = (category: string) => {
    setCheckedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
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
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Toggle Button (mobile only) */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close filters' : 'Open filters'}
          aria-expanded={sidebarOpen}
          className="absolute top-16 left-5 z-30 bg-white p-1 rounded-full shadow-md hover:bg-gray-200 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen
              ? 'absolute inset-y-0 left-0 z-20 w-72 md:relative md:inset-auto'
              : 'w-0 hidden'
          } md:block`}
        >
          <Sidebar
            sidebarOpen={sidebarOpen}
            distance={distance}
            setDistance={setDistance}
            checkedCategories={checkedCategories}
            handleCategoryCheck={handleCategoryCheck}
            price={price}
            setPrice={setPrice}
            resetFilters={resetFilters}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            <div className="sticky top-0 bg-white z-10 pb-4">
              <Tabs defaultValue="All" onValueChange={setSelectedCategory}>
                <TabsList className="mb-4">
                  {[
                    'All',
                    'Pizza',
                    'Burgers',
                    'Sushi',
                    'Mexican',
                    'Chinese',
                    'Vietnamese',
                    'Indian',
                    'Thai',
                    'Healthy',
                    'Breakfast',
                    'Chicken',
                    'Desert',
                    'Coffe',
                    'Grocery',
                    'Alcohol',
                  ].map(tab => (
                    <TabsTrigger key={tab} value={tab}>
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="grid grid-cols-2 gap-2 mb-2">
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
                  Showing results for: <span className="text-black">{selectedCategory}</span>
                </div>
              </Tabs>
            </div>

            <RestaurantDiscovery
              selectedCategory={selectedCategory}
              checkedCategories={checkedCategories}
              query={searchText}
              distance={distance}
              initialSearchLocation={
                typeof location.state?.discoveryLocation === 'string'
                  ? location.state.discoveryLocation
                  : undefined
              }
            />

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
                        (selectedCategory === 'All' || item.category.includes(selectedCategory)) &&
                        (checkedCategories.length === 0 ||
                          checkedCategories.some(category => item.category.includes(category))),
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
      </div>
    </PageWrapper>
  );
}
