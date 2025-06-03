'use client';

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
};

export default function DialogStoreItem({ open, onClose, onSave }: AddItemDialogProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ItemPayload, string>>>({});

  const handleSave = async () => {
    const checkNewItemInput = AddItemPayload.safeParse({
      name: form.name,
      description: form.description,
      price: Number(form.price),
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
      const newItem = { ...checkNewItemInput.data, imgUrl: '' };
      const res = await createItem(newItem as ItemPayload);

      console.log('new Item: ', res);

      onSave(newItem);
      onClose();
    } catch (error: any) {
      console.log('error when create new item: ', error);
    }
  };

  useEffect(() => {
    if (!open) {
      setForm({ name: '', description: '', price: '' });
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
          </div>
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
