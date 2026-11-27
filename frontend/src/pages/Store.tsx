import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DialogStoreItem from '@/components/dialog/DialogStoreItem';
import type { ItemPayload } from '@/schemas/item.schema';
import { useAuth } from '@/context/auth.context';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteStoreById, getStoreById } from '@/services/store.service';
import DialogStore from '@/components/dialog/DialogStore';
import DeleteConfirm from '@/components/shared/DeleteConfirm';
import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { StorePayload } from '@/schemas/store.schema';
import StoreInfo from '@/components/shared/StoreInfo';
import StorePageSkeleton from '@/components/skeletons/StorePageSkeleton';
import { deleteItemByItemId, getAllItemByStore } from '@/services/item.service';
import ItemInfo from '@/components/shared/ItemInfo';
import ItemInfoSkeleton from '@/components/skeletons/ItemInfoSkeleton';
import { toast, Toaster } from 'sonner';
import DialogOrderItem from '@/components/dialog/DialogOrderItem';
import { addDemoCartItem, demoRestaurantAsStore, getDemoRestaurant } from '@/data/demo-restaurants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type DuplicateDraft = { key: string; originalName: string; item: ItemPayload };

export default function StorePage() {
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StorePayload | null>(null);
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [, setisBuyer] = useState(false);
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [store, setStore] = useState<StorePayload>();
  const [items, setItems] = useState<ItemPayload[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isViewBy, setIsViewBy] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ItemPayload | null>();
  const [item, setItem] = useState<ItemPayload | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<ItemPayload | null>(null);
  const demoRestaurant = storeId ? getDemoRestaurant(storeId) : undefined;
  const [drafts, setDrafts] = useState<DuplicateDraft[]>([]);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<ItemPayload | null>(null);
  const [duplicateCount, setDuplicateCount] = useState('1');

  useEffect(() => {
    const saved = sessionStorage.getItem(`menu-drafts:${storeId}`);
    if (!saved) {
      setDrafts([]);
      return;
    }
    try {
      setDrafts(JSON.parse(saved) as DuplicateDraft[]);
    } catch (error) {
      console.error('Unable to read duplicate drafts', error);
      toast.error('Unable to read duplicate drafts in this browser session.');
    }
  }, [storeId]);

  useEffect(() => {
    if (!drafts.length) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [drafts.length]);

  const saveDrafts = (next: DuplicateDraft[]) => {
    setDrafts(next);
    try {
      sessionStorage.setItem(`menu-drafts:${storeId}`, JSON.stringify(next));
    } catch (error) {
      console.error('Unable to persist duplicate drafts', error);
      toast.error(
        'Duplicate drafts could not be saved in this browser session. Keep this page open.',
      );
    }
  };

  const duplicate = () => {
    const count = Number(duplicateCount);
    if (!duplicateItem || !Number.isInteger(count) || count < 1 || count > 50) {
      toast.error('Enter a number between 1 and 50.');
      return;
    }
    const { id: _id, restaurant: _restaurant, ...copy } = duplicateItem;
    const next = Array.from({ length: count }, () => ({
      key: crypto.randomUUID(),
      originalName: copy.name,
      item: copy,
    }));
    saveDrafts([...drafts, ...next]);
    setDuplicateItem(null);
    toast.info('Rename and save each duplicate draft.');
  };

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
    const owner =
      !getDemoRestaurant(storeId ?? '') && (user?.role.includes('restaurant_owner') ?? false);
    const buyer = user?.role.includes('buyer') ?? false;
    setIsOwner(owner);
    setisBuyer(buyer);
    setIsViewBy(!buyer && owner);
  }, [user?.id, storeId]);

  const fetchStoreandItems = async (storeId: string) => {
    const demoStore = getDemoRestaurant(storeId);
    if (demoStore) {
      setStore(demoRestaurantAsStore(demoStore));
      setItems(demoStore.menuItems);
      setLoading(false);
      return;
    }

    if (storeId) {
      try {
        const [store, items] = await Promise.all([
          getStoreById(storeId),
          getAllItemByStore(storeId),
        ]);
        setItems(items?.data);
        setStore(store?.data);
      } catch (error) {
        console.error('Unable to load store and menu', error);
        toast.error('Unable to load the store and menu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddDemoItem = (item: ItemPayload) => {
    setSelectedOrderItem(item);
  };

  const addDemoItemToCart = (orderData: {
    itemId: string;
    quantity: number;
    totalPrice: number;
  }) => {
    const selectedItem = items.find(menuItem => menuItem.id === orderData.itemId);
    if (!selectedItem) {
      toast.error('That sample menu item could not be found.');
      return;
    }

    addDemoCartItem(selectedItem, orderData.quantity);
    toast.success(`${selectedItem.name} added to your sample cart`);
  };

  const handleSaveNewItem = async (_item: ItemPayload) => {
    if (editingDraft) saveDrafts(drafts.filter(draft => draft.key !== editingDraft));
    fetchStoreandItems(storeId ?? '');
  };

  const toggleRoleView = () => {
    setIsOwner(prev => !prev);
    setisBuyer(prev => !prev);
  };

  const onEdit = (item: ItemPayload) => {
    setOpenItemDialog(true);
    setItem(item);
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

  const handleDeleteStoreConfirmed = async () => {
    if (!storeToDelete?.id) return;
    const name = storeToDelete.name;
    try {
      await deleteStoreById(storeToDelete.id);
      toast.success(`delete successfully ${name}`);
      navigate('/landing/stores/owner');
    } catch (error: any) {
      toast.error(error.message || `unable to delete ${name}`);
    } finally {
      setStoreToDelete(null);
    }
  };

  const handleDialogOnclose = () => {
    setOpenItemDialog(false);
    setItem(null);
    setEditingDraft(null);
  };

  return (
    <PageWrapper>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Toggle Sidebar Button (Mobile Only) */}
        {/* <button
          onClick={toggleSidebar}
          className="absolute top-16 left-5 z-30 bg-white p-1 rounded-full shadow-md hover:bg-gray-200 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button> */}

        {/* Sidebar */}
        {/* <div
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
        </div> */}
        {/* Render loading skeleton or main content */}
        {/* Main Content */}
        {loading || !store ? (
          <StorePageSkeleton />
        ) : (
          <>
            <DialogStore
              open={openStoreDialog}
              onClose={() => setOpenStoreDialog(false)}
              onSave={() => fetchStoreandItems(storeId ?? '')}
              onError={msg => toast.error(msg)}
              onSuccess={msg => toast.success(msg)}
              store={store}
            />
            <DeleteConfirm
              itemToDelete={storeToDelete}
              setItemToDelete={setStoreToDelete}
              handleDeleteConfirmed={handleDeleteStoreConfirmed}
            />
            <DialogStoreItem
              open={openItemDialog}
              onClose={handleDialogOnclose}
              onSave={handleSaveNewItem}
              storeId={storeId || ''}
              onError={msg => toast.error(msg)}
              onSuccess={msg => toast.success(msg)}
              item={item}
              duplicateName={drafts.find(draft => draft.key === editingDraft)?.originalName}
            />
            <Dialog
              open={Boolean(duplicateItem)}
              onOpenChange={open => !open && setDuplicateItem(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Duplicate menu item</DialogTitle>
                </DialogHeader>
                <label className="text-sm">
                  Number of copies (1–50)
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={duplicateCount}
                    onChange={e => setDuplicateCount(e.target.value)}
                  />
                </label>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDuplicateItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={duplicate}>Create drafts</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <main className="transition-all duration-300 flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
              <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div>
                  <StoreInfo
                    name={store?.name}
                    openHrs={store?.openHrs}
                    closeHrs={store?.closeHrs}
                    category={store?.category}
                    actions={
                      isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 p-0"
                              aria-label="Store settings"
                            >
                              <Settings className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setOpenStoreDialog(true)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStoreToDelete(store)}
                              className="text-red-500"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    }
                  ></StoreInfo>
                  {store.address && (
                    <p className="text-sm text-gray-600">
                      {[
                        store.address.street,
                        store.address.city,
                        store.address.state,
                        store.address.zip,
                        store.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
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
                  {/* {isBuyer && (
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
                  )} */}

                  {demoRestaurant && (
                    <div className="mb-6 flex items-center justify-between rounded-lg border bg-amber-50 p-4">
                      <p className="text-sm text-amber-900">
                        Demo restaurant: menu and cart are sample data and are not sent as a real
                        order.
                      </p>
                      <Button variant="outline" onClick={() => navigate('/landing/cart')}>
                        View sample cart
                      </Button>
                    </div>
                  )}

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Button className="w-40 mt-2" onClick={() => setOpenItemDialog(true)}>
                        Add a New Menu Item
                      </Button>
                      <Button
                        className="w-40 mt-2"
                        onClick={() => navigate('/landing/stores/owner')}
                      >
                        Your All Stores
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

              {isOwner && drafts.length > 0 && (
                <p role="status" className="mb-4 text-red-600">
                  You have {drafts.length} duplicate draft{drafts.length === 1 ? '' : 's'} to rename
                  and save. Drafts remain in this browser session.
                </p>
              )}

              {loading || !items ? (
                <ItemInfoSkeleton />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(item => (
                    <ItemInfo
                      key={item.id}
                      item={item}
                      isOwner={isOwner}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={selected => {
                        setDuplicateCount('1');
                        setDuplicateItem(selected);
                      }}
                      itemToDelete={itemToDelete!}
                      setItemToDelete={setItemToDelete}
                      handleDeleteConfirmed={handleDeleteConfirmed}
                      handleAddItemToCart={demoRestaurant ? handleAddDemoItem : undefined}
                      isReadOnly={false}
                    ></ItemInfo>
                  ))}
                  {isOwner &&
                    drafts.map(draft => (
                      <ItemInfo
                        key={draft.key}
                        item={draft.item}
                        isOwner
                        isReadOnly={false}
                        isDuplicate
                        onEdit={() => {
                          setEditingDraft(draft.key);
                          setItem(draft.item);
                          setOpenItemDialog(true);
                        }}
                        onDelete={() => {
                          if (window.confirm('Discard this duplicate draft?'))
                            saveDrafts(drafts.filter(d => d.key !== draft.key));
                        }}
                      />
                    ))}
                </div>
              )}
            </main>
          </>
        )}
      </div>
      {demoRestaurant && selectedOrderItem && (
        <DialogOrderItem
          open={Boolean(selectedOrderItem)}
          onClose={() => setSelectedOrderItem(null)}
          item={selectedOrderItem}
          onAddtoCart={addDemoItemToCart}
        />
      )}
      <Toaster richColors position="top-center" />
    </PageWrapper>
  );
}
