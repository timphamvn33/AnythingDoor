import type { ItemProps } from '@/types/item.types';
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
  item: ItemProps;
  isOwner: boolean;
  onEdit: (item: ItemProps) => void;
  onDelete: (item: ItemProps) => void;
  itemToDelete: ItemProps;
  setItemToDelete: (item: ItemProps) => void;
  handleDeleteConfirmed: () => void;
};

export default function ItemInfo({
  item,
  isOwner,
  onEdit,
  onDelete,
  itemToDelete,
  setItemToDelete,
  handleDeleteConfirmed,
}: ItemInfoProps) {
  return (
    <>
      <DeleteConfirm
        itemToDelete={itemToDelete}
        setItemToDelete={setItemToDelete}
        handleDeleteConfirmed={handleDeleteConfirmed}
      ></DeleteConfirm>

      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition">
        {/* Owner Controls */}
        {isOwner && (
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

        <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
        <p className="text-sm text-gray-500">{item.description}</p>
        <div className="mt-2 text-right text-base font-medium text-black">${item.price}</div>
      </div>
    </>
  );
}
