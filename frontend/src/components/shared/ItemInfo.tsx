import type { ItemPayload } from '@/schemas/item.schema';
import { ImageOff, Plus, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import DeleteConfirm from './DeleteConfirm';

type ItemInfoProps = {
  item: ItemPayload;
  isOwner?: boolean;
  isReadOnly: boolean;
  onClick?: () => void;
  onEdit?: (item: ItemPayload) => void;
  onDelete?: (item: ItemPayload) => void;
  onDuplicate?: (item: ItemPayload) => void;
  isDuplicate?: boolean;
  itemToDelete?: ItemPayload;
  setItemToDelete?: (item: ItemPayload) => void;
  handleDeleteConfirmed?: () => void;
  handleAddItemToCart?: (item: ItemPayload) => void;
};

export default function ItemInfo({
  item,
  isOwner,
  isReadOnly,
  onClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onDuplicate,
  isDuplicate = false,
  itemToDelete,
  setItemToDelete,
  handleDeleteConfirmed,
  handleAddItemToCart,
}: ItemInfoProps) {
  return (
    <>
      {setItemToDelete && handleDeleteConfirmed && <DeleteConfirm
        itemToDelete={itemToDelete}
        setItemToDelete={setItemToDelete}
        handleDeleteConfirmed={handleDeleteConfirmed}
      />}

      <div className={`relative bg-black text-white rounded-xl p-4 shadow-md border hover:shadow-lg transition ${isDuplicate ? 'border-2 border-red-500' : 'border-gray-700'}`}>
        {/* Owner Controls */}
        {isOwner && !isReadOnly && (
          <div className="w-full flex justify-end mb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Item settings" className="w-8 h-8 p-0 text-white hover:bg-white/20 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(item)}>Duplicate</DropdownMenuItem>}
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="text-red-600 focus:text-red-700"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {item.imgUrl ? <img src={item.imgUrl} alt="" className="mb-3 h-32 w-full rounded object-cover" /> :
          <div className="mb-3 flex h-32 items-center justify-center rounded bg-gray-800"><ImageOff aria-label="No image" className="h-10 w-10 text-gray-400" /></div>}
        {isDuplicate && <p className="text-sm text-red-400">Duplicate draft: rename and save this item.</p>}
        <h3 className="text-2xl font-semibold text-white">{item.name}</h3>

        <div className="text-sm text-gray-300">
          <span className="font-medium text-gray-200">Description:</span>{' '}
          {item.description || 'No description provided'}
        </div>

        {isReadOnly && handleAddItemToCart && (
          <>
            {/* Plus Button (Top Right) */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 w-8 h-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => {
                handleAddItemToCart(item);
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (isReadOnly) onClick();
              }}
              className="text-sm text-gray-300 mt-1 hover:bg-white/20 hover:text-white"
            >
              <span className="font-medium text-gray-200">Store:</span>{' '}
              {item?.restaurant?.name || 'Unknown'}
            </Button>
          </>
        )}

        {!isReadOnly && handleAddItemToCart && (
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => handleAddItemToCart(item)}
          >
            Add to cart
          </Button>
        )}

        <div className="pt-2 text-right text-lg font-bold text-white">${item.price.toFixed(2)}</div>
      </div>
    </>
  );
}
