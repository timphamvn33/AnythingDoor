import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createItem, updateItem } from '@/services/item.service';
import { AddItemPayload, type ItemPayload } from '@/schemas/item.schema';
import { useElementSubmit } from '@/hooks/useElementSubmit';

type AddItemDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (item: ItemPayload) => void;
  storeId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  item: ItemPayload;
  setItem: (item: ItemPayload) => void;
};

export default function DialogStoreItem({
  open,
  onClose,
  onSave,
  storeId,
  onError,
  onSuccess,
  item,
  setItem,
}: AddItemDialogProps) {
  const createNewItem = async (newItem: ItemPayload) => {
    try {
      const res = await createItem(newItem);

      console.log('new Item: ', res);
      onSave(newItem);
      onClose();
      onSuccess?.(' Create a new item successfully');
    } catch (error: any) {
      onError?.('Unable to create a new item');
    }
  };

  const updateItemFn = async (data: ItemPayload) => {
    try {
      const res = await updateItem(item?.id!, data);
      console.log('Updated store:', res);
      onSave(data);
      onSuccess?.('Store updated successfully');
    } catch (error: any) {
      onError?.(`Unable to update the store ${data.name}`);
    }
  };

  const { handleSave, errors } = useElementSubmit<ItemPayload>({
    schema: AddItemPayload,
    onSave: onSave,
    onSuccess: onSuccess,
    onError: onError,
    onClose: onClose,
    createFn: createNewItem,
    updateFn: updateItemFn,
  });

  useEffect(() => {
    if (open) {
      console.log('hello open');
      console.log('item: ', item);
      if (item?.name === '' || !item) {
        console.log('storeId in opoen: ', storeId);
        console.log('hello new');
        setItem({
          name: '',
          price: undefined as unknown as number,
          category: [],
          restaurantId: storeId,
        });
      }
    }
  }, [open]);

  const handleCategory = (value: string) => {
    const newCategory = value.split(',').map(c => c.trim());
    setItem({ ...item, category: newCategory });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <Input value={item?.name} onChange={e => setItem({ ...item, name: e.target.value })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={item?.description}
              onChange={e => setItem({ ...item, description: e.target.value })}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input
              type="number"
              step="0.01"
              value={item?.price ?? ''}
              onChange={e => setItem({ ...item, price: Number(e.target.value) })}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={item?.available}
              onChange={e => setItem({ ...item, available: e.target.checked })}
              id="available"
            />
            <label htmlFor="available" className="text-sm font-medium">
              Available
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              value={item?.imgUrl}
              onChange={e => setItem({ ...item, imgUrl: e.target.value })}
            />
            {errors.imgUrl && <p className="text-sm text-red-500">{errors.imgUrl}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categories (comma separated)</label>
            <Input value={item?.category} onChange={e => handleCategory(e.target.value)} />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => handleSave(item)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
