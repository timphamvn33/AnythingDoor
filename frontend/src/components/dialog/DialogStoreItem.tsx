import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createItem, updateItem } from '@/services/item.service';
import { AddItemPayload, type ItemPayload } from '@/schemas/item.schema';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (item: ItemPayload) => void;
  storeId: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  item: ItemPayload | null;
  duplicateName?: string;
};

export default function DialogStoreItem({ open, onClose, onSave, storeId, onError, onSuccess, item, duplicateName }: Props) {
  const [form, setForm] = useState<ItemPayload>({ name: '', price: 0, imgUrl: '', category: [], restaurantId: storeId, available: true });
  const [categories, setCategories] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...item, description: item.description || '', ingredients: item.ingredients || '', imgUrl: item.imgUrl || '' } :
      { name: '', price: 0, imgUrl: '', category: [], restaurantId: storeId, available: true });
    setPrice(item ? String(item.price) : '');
    setCategories(item?.category.join(', ') || '');
    setError('');
  }, [open, item, storeId]);

  const save = async () => {
    const parsed = AddItemPayload.safeParse({
      ...form, price: price.trim() ? Number(price) : 0,
      category: categories.split(',').map(c => c.trim()).filter(Boolean),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || 'Check the menu item details.');
      return;
    }
    if (duplicateName && parsed.data.name.trim().toLowerCase() === duplicateName.trim().toLowerCase()) {
      setError('Rename this duplicate before saving.');
      return;
    }
    setSaving(true);
    try {
      if (parsed.data.id) await updateItem(parsed.data.id, parsed.data);
      else await createItem(parsed.data);
      onSave(parsed.data);
      onClose();
      onSuccess(parsed.data.id ? 'Item updated successfully' : 'Item created successfully');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Unable to save the item');
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onOpenChange={value => !value && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{item?.id ? 'Edit' : 'Add'} Menu Item</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <label className="block text-sm">Name <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block text-sm">Description (optional) <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="block text-sm">Price <Input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></label>
        <label className="block text-sm"><input type="checkbox" checked={form.available ?? true} onChange={e => setForm({ ...form, available: e.target.checked })} /> Available</label>
        <label className="block text-sm">Image URL (optional) <Input value={form.imgUrl} onChange={e => setForm({ ...form, imgUrl: e.target.value })} /></label>
        <label className="block text-sm">Categories (comma-separated) <Input value={categories} onChange={e => setCategories(e.target.value)} /></label>
        <label className="block text-sm">Ingredients <Textarea value={form.ingredients || ''} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>Save</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
