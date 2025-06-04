import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { CreateStorePayload, type StorePayload } from '@/schemas/store.schema';
import { Textarea } from '@/components/ui/textarea';
import { createStore, updateByStoreId } from '@/services/store.service';

type DialogStoreProps = {
  open: boolean;
  onClose: () => void;
  onSave: (restaurant: StorePayload) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  store: StorePayload;
  setStore: (store: StorePayload) => void;
};

export default function DialogStore({
  open,
  onClose,
  onSave,
  onError,
  onSuccess,
  store,
  setStore,
}: DialogStoreProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof StorePayload, string>>>({});

  const handleSave = async () => {
    if (!store) return;

    const parsed = validateInput(store);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof StorePayload, string>> = {};
      parsed.error.errors.forEach(err => {
        const field = err.path[0] as keyof StorePayload;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (store.id) {
      await updateExistingStore(parsed.data);
    } else {
      await createNewStore(parsed.data);
    }

    onClose();
  };

  const validateInput = (data: StorePayload) => {
    return CreateStorePayload.safeParse({
      ...data,
      category: data.category.map(c => c.trim()),
    });
  };

  const updateExistingStore = async (data: StorePayload) => {
    try {
      const res = await updateByStoreId(data?.id!, data);
      console.log('Updated store:', res);
      onSave(data);
      onSuccess?.('Store updated successfully');
    } catch (error: any) {
      onError?.('Unable to update the store');
    }
  };

  const createNewStore = async (data: StorePayload) => {
    try {
      const res = await createStore(data);
      console.log('Created store:', res);
      onSave(data);
      onSuccess?.('Created a new store successfully');
    } catch (error: any) {
      onError?.('Unable to create a new store');
    }
  };

  useEffect(() => {
    if (!open) {
      if (!store) {
        setStore({
          name: '',
          description: '',
          logoUrl: '',
          category: [],
          openHrs: '',
          closeHrs: '',
        });
      }

      setErrors({});
    }
  }, [open]);

  const handleCategory = (value: string) => {
    const newCategory = value.split(',').map(c => c.trim());
    setStore({ ...store, category: newCategory });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <Input
              value={store?.name}
              onChange={e => setStore({ ...store, name: e.target.value })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={store?.description}
              onChange={e => setStore({ ...store, description: e.target.value })}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <Input
              value={store?.logoUrl}
              onChange={e => setStore({ ...store, logoUrl: e.target.value })}
            />
            {errors.logoUrl && <p className="text-sm text-red-500">{errors.logoUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category (comma-separated)</label>
            <Input value={store?.category} onChange={e => handleCategory(e.target.value)} />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Open Hours</label>
              <Input
                type="time"
                value={store?.openHrs}
                onChange={e => setStore({ ...store, openHrs: e.target.value })}
              />
              {errors.openHrs && <p className="text-sm text-red-500">{errors.openHrs}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Close Hours</label>
              <Input
                type="time"
                value={store?.closeHrs}
                onChange={e => setStore({ ...store, closeHrs: e.target.value })}
              />
              {errors.closeHrs && <p className="text-sm text-red-500">{errors.closeHrs}</p>}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
