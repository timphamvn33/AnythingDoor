import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DialogStore from '@/components/dialog/DialogStore';
import { getStores } from '@/services/store.service';
import { useAuth } from '@/context/auth.context';
import StoreInfo from '@/components/shared/StoreInfo';
import StoresSkeleton from '@/components/skeletons/StoresSkeleton';
import type { Store } from '@/types/store.types';
import { toast, Toaster } from 'sonner';

// One card fills the page; 2–4 share a single row; more wrap in rows of 4.
const storeGridCols = (count: number) =>
  count <= 1
    ? 'grid-cols-1'
    : count === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : count === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

export default function Stores() {
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Boolean>(false);
  useEffect(() => {
    const getAllStores = async () => {
      setLoading(true);
      getStoresByOwnerId(user?.id ?? '');
    };

    getAllStores();
  }, [user?.id]);

  const getStoresByOwnerId = async (ownerId: string) => {
    if (ownerId) {
      try {
        const res = await getStores(ownerId);
        setStores(res?.data || []);
      } catch (error: any) {
        toast.error(error.message || 'unable to retrieve stores');
        console.error('Failed to fetch stores:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleAddNewStore = () => {
    setOpenStoreDialog(true);
  };

  const handleSaveNewStore = () => {
    getStoresByOwnerId(user?.id ?? '');
    setOpenStoreDialog(false);
  };

  const handleDialogOnclose = () => {
    setOpenStoreDialog(false);
  };

  return (
    <PageWrapper>
      <Navbar />

      {loading || !stores ? (
        <StoresSkeleton />
      ) : (
        <>
          <DialogStore
            open={openStoreDialog}
            onClose={handleDialogOnclose}
            onSave={handleSaveNewStore}
            onError={msg => toast.error(msg)}
            onSuccess={msg => toast.success(msg)}
            store={null}
          />

          <main className="p-4 md:p-8 overflow-y-auto">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold">Are you ready for your own store?</h1>
              <p className="mt-3 text-lg text-gray-600">We can make your dream store come true.</p>
            </div>
            <div className="flex justify-center mb-6">
              <Button onClick={handleAddNewStore}>
                <Plus className="w-4 h-4 mr-2" /> Add New Store
              </Button>
            </div>

            <div className={`grid w-full gap-6 ${storeGridCols(stores.length)}`}>
              {stores.map(store => (
                <div
                  key={store.id}
                  className={`bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer ${
                    stores.length === 1 ? 'min-h-[55vh] p-8 [&_h3]:text-3xl' : 'min-h-48'
                  }`}
                  onClick={() => navigate(`/landing/store/${store.id}`)}
                >
                  <StoreInfo
                    name={store?.name}
                    openHrs={store?.openHrs}
                    closeHrs={store?.closeHrs}
                    category={store?.category}
                    description={store?.description}
                    address={store?.address}
                    phoneNumber={store?.phoneNumber}
                    hours={store?.hours}
                    imageUrl={store?.logoUrl}
                    showImage
                  />
                </div>
              ))}
            </div>
          </main>
        </>
      )}
      <Toaster richColors position="top-center" />
    </PageWrapper>
  );
}
