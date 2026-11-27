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

type ItemForm = { item: ItemPayload; categories: string; price: string };

function makeForm(storeId: string, item?: ItemPayload | null): ItemForm {
  return {
    item: item
      ? { ...item, description: item.description || '', ingredients: item.ingredients || '', imgUrl: item.imgUrl || '' }
      : { name: '', price: 0, imgUrl: '', category: [], restaurantId: storeId, available: true },
    categories: item?.category.join(', ') || '',
    price: item ? String(item.price) : '',
  };
}

export default function DialogStoreItem({ open, onClose, onSave, storeId, onError, onSuccess, item, duplicateName }: Props) {
  const [forms, setForms] = useState<ItemForm[]>([]);
  const [count, setCount] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForms([makeForm(storeId, item)]);
    setCount('1');
    setError('');
  }, [open, item, storeId]);

  const changeCount = (value: string) => {
    setCount(value);
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 50) return;
    setForms(current => Array.from({ length: number }, (_, index) => current[index] || makeForm(storeId)));
  };

  const updateForm = (index: number, change: Partial<ItemForm>) => {
    setForms(current => current.map((form, i) => i === index ? { ...form, ...change } : form));
  };

  const save = async () => {
    const number = Number(count);
    if (!Number.isInteger(number) || number < 1 || number > 50 || number !== forms.length) {
      setError('Enter a number of items between 1 and 50.');
      return;
    }

    const parsedItems: ItemPayload[] = [];
    for (const [index, form] of forms.entries()) {
      const parsed = AddItemPayload.safeParse({
        ...form.item,
        name: form.item.name.trim(),
        price: form.price.trim() ? Number(form.price) : 0,
        category: form.categories.split(',').map(c => c.trim()).filter(Boolean),
      });
      if (!parsed.success) {
        setError(`Item ${index + 1}: ${parsed.error.errors[0]?.message || 'Check the menu item details.'}`);
        return;
      }
      if (duplicateName && parsed.data.name.toLowerCase() === duplicateName.trim().toLowerCase()) {
        setError('Rename this duplicate before saving.');
        return;
      }
      parsedItems.push(parsed.data);
    }

    setError('');
    setSaving(true);
    let saved = 0;
    try {
      for (const data of parsedItems) {
        if (data.id) await updateItem(data.id, data);
        else await createItem(data);
        saved++;
      }
      onSave(parsedItems[parsedItems.length - 1]);
      onClose();
      onSuccess(item?.id ? 'Item updated successfully' : `${saved} menu item${saved === 1 ? '' : 's'} created successfully`);
    } catch (e) {
      if (saved > 0) {
        setForms(current => current.slice(saved));
        setCount(String(parsedItems.length - saved));
        onSave(parsedItems[saved - 1]);
      }
      const message = e instanceof Error ? e.message : 'Unable to save the item';
      setError(`${saved > 0 ? `${saved} item${saved === 1 ? '' : 's'} created. ` : ''}Item ${saved + 1} could not be saved: ${message}`);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onOpenChange={value => !value && !saving && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto" onInteractOutside={event => { if (saving) event.preventDefault(); }} onEscapeKeyDown={event => { if (saving) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{item?.id ? 'Edit Menu Item' : duplicateName ? 'Save Duplicate Item' : 'Add Menu Items'}</DialogTitle></DialogHeader>
      {!item && <label className="block text-sm">Number of items (1–50)
        <Input type="number" min="1" max="50" value={count} onChange={e => changeCount(e.target.value)} disabled={saving} />
      </label>}
      <div className="space-y-6">
        {forms.map((form, index) => <fieldset key={index} disabled={saving} className="space-y-4">
          {!item && <legend className="font-semibold">Item {index + 1}</legend>}
          <label className="block text-sm">Name <Input value={form.item.name} onChange={e => updateForm(index, { item: { ...form.item, name: e.target.value } })} /></label>
          <label className="block text-sm">Description (optional) <Textarea value={form.item.description || ''} onChange={e => updateForm(index, { item: { ...form.item, description: e.target.value } })} /></label>
          <label className="block text-sm">Price <Input type="number" min="0.01" step="0.01" value={form.price} onChange={e => updateForm(index, { price: e.target.value })} /></label>
          <label className="block text-sm"><input type="checkbox" checked={form.item.available ?? true} onChange={e => updateForm(index, { item: { ...form.item, available: e.target.checked } })} /> Available</label>
          <label className="block text-sm">Image URL (optional) <Input value={form.item.imgUrl} onChange={e => updateForm(index, { item: { ...form.item, imgUrl: e.target.value } })} /></label>
          <label className="block text-sm">Categories (comma-separated) <Input value={form.categories} onChange={e => updateForm(index, { categories: e.target.value })} /></label>
          <label className="block text-sm">Ingredients <Textarea value={form.item.ingredients || ''} onChange={e => updateForm(index, { item: { ...form.item, ingredients: e.target.value } })} /></label>
        </fieldset>)}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      <DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{item ? 'Save' : 'Create'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
