import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DialogStore from '@/components/dialog/DialogStore';
import type { StorePayload } from '@/schemas/store.schema';
import { getStores } from '@/services/store.service';
import { useAuth } from '@/context/auth.context';
import StoreInfo from '@/components/shared/StoreInfo';

export default function Stores() {
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [stores, setStores] = useState<StorePayload[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getAllStores = async () => {
      const ownerId = user?.id;
      if (ownerId) {
        try {
          const res = await getStores(ownerId);
          console.log('res: ', res);
          setStores(res?.data || []);
        } catch (error) {
          console.error('Failed to fetch stores:', error);
        }
      }
    };

    getAllStores();
  }, [user?.id]);

  const handleAddNewStore = () => {
    setOpenStoreDialog(true);
  };

  const handleSaveNewStore = (newStore: StorePayload) => {
    setStores(prev => [...prev, newStore]);
    setOpenStoreDialog(false);
  };

  return (
    <PageWrapper>
      <Navbar />
      <DialogStore
        open={openStoreDialog}
        onClose={() => setOpenStoreDialog(false)}
        onSave={handleSaveNewStore}
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
                ></StoreInfo>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate(`/landing/store/${store.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" /> Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </PageWrapper>
  );
}
