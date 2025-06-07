import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/SideNavbar';
import { ArrowLeftRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import DialogStoreItem from '@/components/dialog/DialogStoreItem';
import type { ItemPayload } from '@/schemas/item.schema';
import { useAuth } from '@/context/auth.context';
import { useNavigate, useParams } from 'react-router-dom';
import { getStoreById } from '@/services/store.service';
import type { StorePayload } from '@/schemas/store.schema';
import StoreInfo from '@/components/shared/StoreInfo';
import StorePageSkeleton from '@/components/skeletons/StorePageSkeleton';
import { deleteItemByItemId, getAllItemByStore } from '@/services/item.service';
import ItemInfo from '@/components/shared/ItemInfo';
import ItemInfoSkeleton from '@/components/skeletons/ItemInfoSkeleton';
import { toast, Toaster } from 'sonner';

export default function StorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pickupMethod, setPickupMethod] = useState('pickup');
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [price, setPrice] = useState('$');
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isBuyer, setisBuyer] = useState(false);
  const navigate = useNavigate();
  const { storeId } = useParams();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [store, setStore] = useState<StorePayload>();
  const [items, setItems] = useState<ItemPayload[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isViewBy, setIsViewBy] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ItemPayload | null>();
  const [item, setItem] = useState<ItemPayload | null>(null);

  const renderRating = (stars: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));

  useEffect(() => {
    setLoading(true);
    fetchStoreandItems(storeId ?? '');
    const owner = user?.role.includes('restaurant_owner') ?? false;
    const buyer = user?.role.includes('buyer') ?? false;
    setIsOwner(owner);
    setisBuyer(buyer);
    setIsViewBy(!buyer && owner);

    console.log('isBuyer: ', buyer);
    console.log('isOwner: ', owner);
    console.log('!isBuyer && isOwner: ', !buyer && owner);
  }, [user?.id, storeId]);

  const fetchStoreandItems = async (storeId: string) => {
    if (storeId) {
      const store = await getStoreById(storeId);
      const items = await getAllItemByStore(storeId);
      setItems(items?.data);
      console.log('items: ', items);

      setStore(store?.data);
      console.log('store: ', store?.data);
      setLoading(false);
    }
  };

  const handleCategoryCheck = (category: string) => {
    setCheckedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
  };

  const resetFilters = () => {
    setCheckedCategories([]);
    setPrice('$');
  };

  const handleSaveNewItem = async (item: ItemPayload) => {
    fetchStoreandItems(storeId ?? '');
    console.log('Saved Item:', item);
  };

  const toggleRoleView = () => {
    setIsOwner(prev => !prev);
    setisBuyer(prev => !prev);
  };

  const onEdit = (item: ItemPayload) => {
    setOpenItemDialog(true);
    setItem(item);
    console.log('edit item ....');
  };

  const onDelete = (item: ItemPayload) => {
    setItemToDelete(item);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItemByItemId(itemToDelete?.id ?? '');
      setItemToDelete(null);
      const items = await getAllItemByStore(storeId ?? '');
      setItems(items?.data);
      toast.success(`delete successfully ${itemToDelete?.name}`);
    } catch (error: any) {
      toast.error(error.message || `unable to delete ${itemToDelete?.name}`);
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Toggle Sidebar Button (Mobile Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-16 left-5 z-30 bg-white p-1 rounded-full shadow-md hover:bg-gray-200 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-72 block' : 'w-0 hidden'
          } md:block`}
        >
          <Sidebar
            sidebarOpen={sidebarOpen}
            distance=""
            setDistance={() => {}}
            checkedCategories={checkedCategories}
            handleCategoryCheck={handleCategoryCheck}
            price={price}
            setPrice={setPrice}
            resetFilters={resetFilters}
            customSections={[
              { title: 'Appetizers', items: ['Spring Rolls', 'Mozzarella Sticks'] },
              { title: 'Desserts', items: ['Cheesecake', 'Ice Cream'] },
              { title: 'Beverages', items: ['Soda', 'Iced Tea'] },
            ]}
          />
        </div>
        {/* Render loading skeleton or main content */}
        {/* Main Content */}
        {loading || !store ? (
          <StorePageSkeleton />
        ) : (
          <>
            <DialogStoreItem
              open={openItemDialog}
              onClose={() => setOpenItemDialog(false)}
              onSave={handleSaveNewItem}
              storeId={storeId || ''}
              onError={msg => toast.error(msg)}
              onSuccess={msg => toast.success(msg)}
              item={item!}
              setItem={setItem}
            />
            <main className="transition-all duration-300 flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
              <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div>
                  <StoreInfo
                    name={store?.name}
                    openHrs={store?.openHrs}
                    closeHrs={store?.closeHrs}
                    category={store?.category}
                  ></StoreInfo>
                  <p className="text-sm text-gray-600">123 Main St, San Diego, CA</p>
                  <div className="flex items-center mt-1">{renderRating(4)}</div>
                </div>

                <div className="flex flex-col col-end-1 gap-2">
                  {/* Static View Toggle Button */}
                  {isViewBy && (
                    <div>
                      <Button variant="secondary" onClick={toggleRoleView}>
                        View as {isOwner ? 'Buyer' : 'Owner'}
                      </Button>
                    </div>
                  )}

                  {/* Buyer Controls */}
                  {isBuyer && (
                    <div className="flex flex-col items-end gap-2">
                      <RadioGroup
                        defaultValue="pickup"
                        onValueChange={setPickupMethod}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup">Pickup</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery">Delivery</Label>
                        </div>
                      </RadioGroup>
                      <Button className="w-28">Checkout</Button>
                    </div>
                  )}

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button className="w-28 mt-2" onClick={() => setOpenItemDialog(true)}>
                        Add New
                      </Button>
                      <Button
                        className="w-28 mt-2"
                        onClick={() => navigate('/landing/stores/owner')}
                      >
                        All Stores
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews or comments placeholder */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Customer Reviews</h3>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <p className="text-sm text-gray-700">
                    “Great food and friendly service. Will definitely come again!” – Alice M.
                  </p>
                </div>
              </div>

              {/* Menu Items */}

              {loading || !items ? (
                <ItemInfoSkeleton />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item, _) => (
                    <ItemInfo
                      item={item}
                      isOwner={isOwner}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      itemToDelete={itemToDelete!}
                      setItemToDelete={setItemToDelete}
                      handleDeleteConfirmed={handleDeleteConfirmed}
                    ></ItemInfo>
                  ))}
                </div>
              )}
            </main>
          </>
        )}
      </div>
      <Toaster richColors position="top-center" />
    </PageWrapper>
  );
}
