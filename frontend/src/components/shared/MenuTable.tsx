import { useEffect, useState } from 'react';
import { ImageOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddItemPayload, type ItemPayload } from '@/schemas/item.schema';
import { createItem, updateItem } from '@/services/item.service';

export type DuplicateDraft = { key: string; originalName: string; item: ItemPayload };
type Row = { key: string; item: ItemPayload; price: string; categories: string };

type Props = {
  title: string;
  section: string | null;
  storeId: string;
  items: ItemPayload[];
  drafts: DuplicateDraft[];
  newCount?: number;
  isOwner: boolean;
  isDemo: boolean;
  onSaved: (item: ItemPayload) => void;
  onFinished: () => void;
  onDiscard: () => void;
  onEditingChange: (editing: boolean) => void;
  onRename: () => void;
  onDeleteTable: () => void;
  onEditItem: (item: ItemPayload) => void;
  onEditDraft: (draft: DuplicateDraft) => void;
  onDelete: (item: ItemPayload) => void;
  onDeleteDraft: (draft: DuplicateDraft) => void;
  onDuplicate: (item: ItemPayload) => void;
  onAddToCart: (item: ItemPayload) => void;
};

function rowFor(item: ItemPayload): Row {
  return {
    key: item.id || crypto.randomUUID(),
    item,
    price: item.id ? String(item.price) : '',
    categories: item.category.join(', '),
  };
}

export default function MenuTable({
  title,
  section,
  storeId,
  items,
  drafts,
  newCount,
  isOwner,
  isDemo,
  onSaved,
  onFinished,
  onDiscard,
  onEditingChange,
  onRename,
  onDeleteTable,
  onEditItem,
  onEditDraft,
  onDelete,
  onDeleteDraft,
  onDuplicate,
  onAddToCart,
}: Props) {
  const [editing, setEditing] = useState(newCount !== undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Row[]>(() =>
    newCount
      ? Array.from({ length: newCount }, () =>
          rowFor({
            name: '',
            price: 0,
            imgUrl: '',
            category: [],
            restaurantId: storeId,
            available: true,
            menuSection: section,
          }),
        )
      : [],
  );

  useEffect(() => {
    if (!editing) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editing]);

  const edit = () => {
    setRows(items.map(rowFor));
    setError('');
    setEditing(true);
    onEditingChange(true);
  };

  const change = (index: number, patch: Partial<Row>) =>
    setRows(current => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const save = async () => {
    const parsed: ItemPayload[] = [];
    for (const [index, row] of rows.entries()) {
      const result = AddItemPayload.safeParse({
        ...row.item,
        name: row.item.name.trim(),
        price: row.price.trim() ? Number(row.price) : 0,
        category: row.categories
          .split(',')
          .map(value => value.trim())
          .filter(Boolean),
        menuSection: section,
      });
      if (!result.success) {
        setError(
          `Row ${index + 1}: ${result.error.errors[0]?.message || 'Check the item details.'}`,
        );
        return;
      }
      parsed.push(result.data);
    }

    setError('');
    setSaving(true);
    let saved = 0;
    try {
      for (const [index, item] of parsed.entries()) {
        const { id, restaurant: _restaurant, ...data } = item;
        const response = id ? await updateItem(id, data) : await createItem(data);
        const savedId = id || response.data?.id;
        if (typeof savedId !== 'string' || !savedId) {
          throw new Error('The server did not return an item ID. Reload the menu before retrying.');
        }
        const savedItem = { ...item, id: savedId };
        setRows(current =>
          current.map((row, i) => (i === index ? { ...row, item: savedItem } : row)),
        );
        onSaved(savedItem);
        saved++;
      }
      setEditing(false);
      onEditingChange(false);
      onFinished();
      toast.success(`${title} saved.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to save the item.';
      setError(`${saved} of ${parsed.length} rows saved. Row ${saved + 1}: ${message}`);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (!window.confirm('Discard unsaved table changes?')) return;
    setEditing(false);
    onEditingChange(false);
    setError('');
    if (newCount !== undefined) onDiscard();
  };

  const hasActions = isOwner || isDemo;
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={`Settings for ${title} table`}>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onRename}>Edit table title</DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteTable} disabled={saving} className="text-red-600 focus:text-red-700">
                Delete table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="bg-gray-100">
            <tr>
              {[
                'Image',
                'Name',
                'Description',
                'Price',
                'Categories',
                'Ingredients',
                'Availability',
              ].map(label => (
                <th key={label} scope="col" className="p-3">
                  {label}
                </th>
              ))}
              {hasActions && (
                <th scope="col" className="p-3">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {editing
              ? rows.map((row, index) => (
                  <tr key={row.key} className="border-t bg-white">
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} image URL`}
                        className="min-w-40"
                        value={row.item.imgUrl}
                        disabled={saving}
                        onChange={e =>
                          change(index, { item: { ...row.item, imgUrl: e.target.value } })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} name`}
                        className="min-w-36"
                        value={row.item.name}
                        disabled={saving}
                        onChange={e =>
                          change(index, { item: { ...row.item, name: e.target.value } })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} description`}
                        className="min-w-40"
                        value={row.item.description || ''}
                        disabled={saving}
                        onChange={e =>
                          change(index, { item: { ...row.item, description: e.target.value } })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} price`}
                        className="min-w-24"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.price}
                        disabled={saving}
                        onChange={e => change(index, { price: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} categories`}
                        className="min-w-36"
                        value={row.categories}
                        disabled={saving}
                        onChange={e => change(index, { categories: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        aria-label={`Row ${index + 1} ingredients`}
                        className="min-w-36"
                        value={row.item.ingredients || ''}
                        disabled={saving}
                        onChange={e =>
                          change(index, { item: { ...row.item, ingredients: e.target.value } })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <label>
                        <input
                          aria-label={`Row ${index + 1} available`}
                          type="checkbox"
                          checked={row.item.available ?? true}
                          disabled={saving}
                          onChange={e =>
                            change(index, { item: { ...row.item, available: e.target.checked } })
                          }
                        />{' '}
                        Available
                      </label>
                    </td>
                    {hasActions && <td />}
                  </tr>
                ))
              : [
                  ...items.map(item => ({ key: item.id, item, draft: undefined })),
                  ...drafts.map(draft => ({ key: draft.key, item: draft.item, draft })),
                ].map(({ key, item, draft }) => (
                  <tr key={key} className={`border-t ${draft ? 'bg-red-50' : 'bg-white'}`}>
                    <td className="p-3">
                      {item.imgUrl ? (
                        <img src={item.imgUrl} alt="" className="h-14 w-14 rounded object-cover" />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded bg-gray-100">
                          <ImageOff aria-label="No image" className="h-6 w-6 text-gray-400" />
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {item.name}
                      {draft && <p className="text-red-600">Duplicate draft: rename and save.</p>}
                    </td>
                    <td className="p-3">{item.description || 'No description provided'}</td>
                    <td className="p-3">${Number(item.price).toFixed(2)}</td>
                    <td className="p-3">{item.category.join(', ') || '—'}</td>
                    <td className="p-3">{item.ingredients || '—'}</td>
                    <td className="p-3">
                      {item.available === false ? 'Unavailable' : 'Available'}
                    </td>
                    {hasActions && (
                      <td className="p-3">
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Settings for ${item.name}`}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => (draft ? onEditDraft(draft) : onEditItem(item))}
                              >
                                Edit
                              </DropdownMenuItem>
                              {!draft && (
                                <DropdownMenuItem onClick={() => onDuplicate(item)}>
                                  Duplicate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onClick={() => (draft ? onDeleteDraft(draft) : onDelete(item))}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {isDemo && (
                          <Button variant="outline" onClick={() => onAddToCart(item)}>
                            Add to cart
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {isOwner && (
        <div className="mt-3 flex gap-2">
          {editing ? (
            <>
              <Button onClick={save} disabled={saving}>
                Save
              </Button>
              <Button variant="outline" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
            </>
          ) : (
            items.length > 0 && <Button onClick={edit}>Edit</Button>
          )}
        </div>
      )}
    </section>
  );
}
