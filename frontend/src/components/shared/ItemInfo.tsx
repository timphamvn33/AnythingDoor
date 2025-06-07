import type { ItemPayload } from '@/schemas/item.schema';
import { MoreVertical } from 'lucide-react';
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
  itemToDelete?: ItemPayload;
  setItemToDelete?: (item: ItemPayload) => void;
  handleDeleteConfirmed?: () => void;
};

export default function ItemInfo({
  item,
  isOwner,
  isReadOnly,
  onClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  itemToDelete,
  setItemToDelete,
  handleDeleteConfirmed,
}: ItemInfoProps) {
  return (
    <>
      <DeleteConfirm
        itemToDelete={itemToDelete}
        setItemToDelete={setItemToDelete!}
        handleDeleteConfirmed={handleDeleteConfirmed!}
      ></DeleteConfirm>

      <div
        className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
        onClick={() => {
          if (isReadOnly) onClick();
        }}
      >
        {/* Owner Controls */}
        {isOwner && !isReadOnly && (
          <div className="w-full flex justify-end mb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-8 h-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
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

        <h3 className="text-2xl font-semibold text-gray-800">{item.name}</h3>

        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Description:</span>{' '}
          {item.description || 'No description provided'}
        </div>

        {isReadOnly && (
          <>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Store:</span>{' '}
              {item?.restaurant?.name || 'Unknown'}
            </div>
          </>
        )}

        <div className="pt-2 text-right text-lg font-bold text-black">${item.price.toFixed(2)}</div>
      </div>
    </>
  );
}
