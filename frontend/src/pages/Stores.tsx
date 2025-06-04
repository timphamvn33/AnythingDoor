import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Eye, MoreVertical, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DialogStore from '@/components/dialog/DialogStore';
import { deleteStoreById, getStores } from '@/services/store.service';
import { useAuth } from '@/context/auth.context';
import StoreInfo from '@/components/shared/StoreInfo';
import StoresSkeleton from '@/components/skeletons/StoresSkeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import DeleteConfirm from '@/components/shared/DeleteConfirm';
import type { Store } from '@/types/store.types';
import { toast, Toaster } from 'sonner';
import type { StorePayload } from '@/schemas/store.schema';

export default function Stores() {
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [store, setStore] = useState<StorePayload | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Boolean>(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
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
        console.log('res: ', res);
        setStores(res?.data || []);
        setLoading(false);
      } catch (error: any) {
        toast.error(error.message || 'unable to retrieve stores');
        console.error('Failed to fetch stores:', error);
      }
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
    setStore(null);
  };

  const handleEdit = (store: StorePayload) => {
    setOpenStoreDialog(true);
    setStore(store);
    console.log('Edit store', store?.id);
  };

  const handleDeleteConfirmed = async () => {
    if (!storeToDelete) return;
    const storeId = storeToDelete.id;
    const storeNm = storeToDelete.name;
    try {
      await deleteStoreById(storeId ?? '');
      await getStoresByOwnerId(user?.id ?? '');
      setStoreToDelete(null);
      toast.success(`delete successfully ${storeNm}`);
    } catch (error: any) {
      toast.error(error.message || `unable to delete ${storeNm}`);
    }
  };
  return (
    <PageWrapper>
      <Navbar />
      <DeleteConfirm
        storeToDelete={storeToDelete}
        setStoreToDelete={setStoreToDelete}
        handleDeleteConfirmed={handleDeleteConfirmed}
      ></DeleteConfirm>

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
            store={store!}
            setStore={setStore}
          />

          <main className="p-4 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Stores</h2>
              <Button onClick={handleAddNewStore}>
                <Plus className="w-4 h-4 mr-2" /> Add New Store
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map(store => (
                <div
                  key={store.id}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <StoreInfo
                      name={store?.name}
                      openHrs={store?.openHrs}
                      closeHrs={store?.closeHrs}
                      category={store?.category}
                    />

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate(`/landing/store/${store.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(store)}>
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
                    </div>
                  </div>
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
