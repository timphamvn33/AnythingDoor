import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CreateStorePayload, type StorePayload } from '@/schemas/store.schema';
import { createStore, updateByStoreId } from '@/services/store.service';

type Day = NonNullable<StorePayload['hours']>[number]['day'];
const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const blankAddress = { street: '', city: '', state: '', zip: '', country: '' };
const emptyStore: StorePayload = {
  name: '', description: '', logoUrl: '', category: [], openHrs: '', closeHrs: '',
  phoneNumber: '', address: blankAddress, hours: [],
};
const timeValue = (value: string) => value.includes('T') ? value.slice(11, 16) : value;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  store: StorePayload | null;
};

export default function DialogStore({ open, onClose, onSave, onError, onSuccess, store }: Props) {
  const [form, setForm] = useState<StorePayload>(emptyStore);
  const [categories, setCategories] = useState('');
  const [differentHours, setDifferentHours] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const stored = (store?.hours || []).map(h => ({
      ...h, opensAt: timeValue(h.opensAt), closesAt: timeValue(h.closesAt),
    }));
    const opens = timeValue(store?.openHrs || '');
    const closes = timeValue(store?.closeHrs || '');
    const hours = stored.length ? stored : days.map(day => ({ day, opensAt: opens, closesAt: closes }));
    const address = store?.address;
    setForm({
      ...emptyStore, ...store,
      description: store?.description || '', logoUrl: store?.logoUrl || '',
      phoneNumber: store?.phoneNumber || '',
      address: address ? {
        street: address.street, city: address.city, state: address.state,
        zip: address.zip, country: address.country,
      } : blankAddress,
      hours,
    });
    setCategories(store?.category.join(', ') || '');
    setDifferentHours(stored.some(h => h.opensAt !== opens || h.closesAt !== closes));
    setError('');
  }, [open, store]);

  const toggleDay = (day: Day, checked: boolean) => {
    const hours = form.hours || [];
    setForm({ ...form, hours: checked
      ? [...hours, { day, opensAt: form.openHrs, closesAt: form.closeHrs }]
      : hours.filter(h => h.day !== day) });
  };

  const save = async () => {
    const hours = (form.hours || []).map(h => differentHours ? h : {
      ...h, opensAt: form.openHrs, closesAt: form.closeHrs,
    });
    const payload = {
      ...form, openHrs: differentHours ? hours[0]?.opensAt || '' : form.openHrs,
      closeHrs: differentHours ? hours[0]?.closesAt || '' : form.closeHrs,
      category: categories.split(',').map(c => c.trim()).filter(Boolean), hours,
    };
    const parsed = CreateStorePayload.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || 'Check the store details.');
      return;
    }
    if (!payload.phoneNumber?.trim() || !payload.category.length || !hours.length || hours.some(h => !h.opensAt || !h.closesAt)) {
      setError('Enter a phone number and category, and select opening days and hours.');
      return;
    }
    setSaving(true);
    try {
      if (store?.id) await updateByStoreId(store.id, parsed.data);
      else await createStore(parsed.data);
      onSave();
      onClose();
      onSuccess(store?.id ? 'Store updated successfully' : 'Store created successfully');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Unable to save the store');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{store?.id ? 'Edit' : 'Create'} Store</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm">Store name
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm">Description (optional)
            <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="block text-sm">Logo URL (optional)
            <Input value={form.logoUrl || ''} onChange={e => setForm({ ...form, logoUrl: e.target.value })} />
          </label>
          <label className="block text-sm">Categories (comma-separated)
            <Input value={categories} onChange={e => setCategories(e.target.value)} />
          </label>
          <label className="block text-sm">Phone number
            <Input type="tel" value={form.phoneNumber || ''} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
          </label>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Address</legend>
            {(['street', 'city', 'state', 'zip', 'country'] as const).map(field => (
              <label key={field} className="block text-sm capitalize">{field}
                <Input value={form.address?.[field] || ''} onChange={e => setForm({
                  ...form, address: { ...(form.address || blankAddress), [field]: e.target.value },
                })} />
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Opening days</legend>
            <div className="flex flex-wrap gap-3">
              {days.map(day => <label key={day} className="text-sm capitalize">
                <input type="checkbox" checked={Boolean(form.hours?.some(h => h.day === day))}
                  onChange={e => toggleDay(day, e.target.checked)} /> {day}
              </label>)}
            </div>
          </fieldset>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Hours</legend>
            <label className="mr-4 text-sm"><input type="radio" name="hours-mode" checked={!differentHours} onChange={() => setDifferentHours(false)} /> Same hours each day</label>
            <label className="text-sm"><input type="radio" name="hours-mode" onChange={() => {
              setForm({ ...form, hours: form.hours?.map(h => ({ ...h, opensAt: form.openHrs, closesAt: form.closeHrs })) });
              setDifferentHours(true);
            }} /> Different hours by day</label>
            {!differentHours && <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Open <Input type="time" value={form.openHrs} onChange={e => setForm({ ...form, openHrs: e.target.value })} /></label>
              <label className="text-sm">Close <Input type="time" value={form.closeHrs} onChange={e => setForm({ ...form, closeHrs: e.target.value })} /></label>
            </div>}
            {differentHours && days.map(day => {
              const hours = form.hours?.find(h => h.day === day);
              if (!hours) return null;
              return <div key={day} className="grid grid-cols-2 gap-3">
                {(['opensAt', 'closesAt'] as const).map(field => <label key={field} className="text-sm capitalize">{day} {field === 'opensAt' ? 'open' : 'close'}
                  <Input type="time" value={hours[field]} onChange={e => setForm({
                    ...form, hours: form.hours?.map(h => h.day === day ? { ...h, [field]: e.target.value } : h),
                  })} />
                </label>)}
              </div>;
            })}
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
