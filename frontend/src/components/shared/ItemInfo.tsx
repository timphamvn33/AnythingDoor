import type { ItemProps } from '@/types/item.types';
import { Pencil } from 'lucide-react';

type ItemInfoProps = {
  items: ItemProps[];
  isOwner: boolean;
};
export default function ItemInfo({ items, isOwner }: ItemInfoProps) {
  return (
    <>
      {/* Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            {/* Edit Button */}
            {isOwner && (
              <div className="w-full flex justify-end mt-4">
                <button className="text-gray-500 hover:text-gray-800 transition">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
            <div className="mt-2 text-right text-base font-medium text-black">${item.price}</div>
          </div>
        ))}
      </div>
    </>
  );
}
