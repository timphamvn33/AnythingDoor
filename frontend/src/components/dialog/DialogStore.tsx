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
import { createStore } from '@/services/store.service';

type DialogStoreProps = {
  open: boolean;
  onClose: () => void;
  onSave: (restaurant: StorePayload) => void;
};

export default function DialogStore({ open, onClose, onSave }: DialogStoreProps) {
  const [form, setForm] = useState<{
    name: string;
    description: string;
    logoUrl: string;
    category: string;
    openHrs: string;
    closeHrs: string;
  }>({
    name: '',
    description: '',
    logoUrl: '',
    category: '',
    openHrs: '',
    closeHrs: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StorePayload, string>>>({});

  const handleSave = async () => {
    const parsed = CreateStorePayload.safeParse({
      name: form.name,
      description: form.description,
      logoUrl: form.logoUrl,
      category: form.category.split(',').map(c => c.trim()),
      openHrs: form.openHrs,
      closeHrs: form.closeHrs,
    });

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.errors.forEach(err => {
        const field = err.path[0] as keyof StorePayload;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const newStore = parsed.data;
      const res = await createStore(newStore);
      console.log('Created store:', res);
      onSave(newStore);
      onClose();
    } catch (err) {
      console.error('Failed to create store:', err);
    }
  };

  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        description: '',
        logoUrl: '',
        category: '',
        openHrs: '',
        closeHrs: '',
      });
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
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
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <Input
              value={form.logoUrl}
              onChange={e => setForm({ ...form, logoUrl: e.target.value })}
            />
            {errors.logoUrl && <p className="text-sm text-red-500">{errors.logoUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category (comma-separated)</label>
            <Input
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Open Hours</label>
              <Input
                type="time"
                value={form.openHrs}
                onChange={e => setForm({ ...form, openHrs: e.target.value })}
              />
              {errors.openHrs && <p className="text-sm text-red-500">{errors.openHrs}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Close Hours</label>
              <Input
                type="time"
                value={form.closeHrs}
                onChange={e => setForm({ ...form, closeHrs: e.target.value })}
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
