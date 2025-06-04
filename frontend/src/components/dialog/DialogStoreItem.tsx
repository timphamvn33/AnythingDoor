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
import { createItem } from '@/services/item.service';
import { AddItemPayload, type ItemPayload } from '@/schemas/item.schema';

type AddItemDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (item: ItemPayload) => void;
  storeId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export default function DialogStoreItem({
  open,
  onClose,
  onSave,
  storeId,
  onError,
  onSuccess,
}: AddItemDialogProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    available: false,
    imgUrl: '',
    category: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ItemPayload, string>>>({});

  const handleSave = async () => {
    const parsedCategories = form.category
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat !== '');

    const checkNewItemInput = AddItemPayload.safeParse({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      available: form.available,
      imgUrl: form.imgUrl,
      restaurantId: storeId,
      category: parsedCategories,
    });

    if (!checkNewItemInput.success) {
      const fieldErrors: typeof errors = {};
      checkNewItemInput.error.errors.forEach(err => {
        const field = err.path[0] as keyof ItemPayload;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const newItem = checkNewItemInput.data;
      const res = await createItem(newItem as ItemPayload);

      console.log('new Item: ', res);
      onSave(newItem);
      onClose();
      onSuccess?.(' Create a new item successfully');
    } catch (error: any) {
      onError?.('Unable to create a new item');
    }
  };

  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        description: '',
        price: '',
        available: false,
        imgUrl: '',
        category: '',
      });
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.available}
              onChange={e => setForm({ ...form, available: e.target.checked })}
              id="available"
            />
            <label htmlFor="available" className="text-sm font-medium">
              Available
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              value={form.imgUrl}
              onChange={e => setForm({ ...form, imgUrl: e.target.value })}
            />
            {errors.imgUrl && <p className="text-sm text-red-500">{errors.imgUrl}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categories (comma separated)</label>
            <Input
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
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
