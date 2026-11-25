import {
  Coffee,
  Croissant,
  Drumstick,
  Fish,
  IceCreamCone,
  LayoutGrid,
  Pizza,
  Salad,
  Sandwich,
  ShoppingBasket,
  Wine,
} from 'lucide-react';
import chinaFlag from 'flag-icons/flags/4x3/cn.svg';
import indiaFlag from 'flag-icons/flags/4x3/in.svg';
import mexicoFlag from 'flag-icons/flags/4x3/mx.svg';
import thailandFlag from 'flag-icons/flags/4x3/th.svg';
import vietnamFlag from 'flag-icons/flags/4x3/vn.svg';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const categories = [
  { value: 'All', icon: LayoutGrid },
  { value: 'Pizza', icon: Pizza },
  { value: 'Burgers', icon: Sandwich },
  { value: 'Sushi', icon: Fish },
  { value: 'Mexican', flag: mexicoFlag },
  { value: 'Chinese', flag: chinaFlag },
  { value: 'Vietnamese', flag: vietnamFlag },
  { value: 'Indian', flag: indiaFlag },
  { value: 'Thai', flag: thailandFlag },
  { value: 'Healthy', icon: Salad },
  { value: 'Breakfast', icon: Croissant },
  { value: 'Chicken', icon: Drumstick },
  { value: 'Desert', label: 'Dessert', icon: IceCreamCone },
  { value: 'Coffe', label: 'Coffee', icon: Coffee },
  { value: 'Grocery', icon: ShoppingBasket },
  { value: 'Alcohol', icon: Wine },
];

export default function CategoryNavigation() {
  return (
    <nav
      aria-label="Food categories"
      className="w-16 shrink-0 overflow-y-auto border-r bg-white p-2 md:w-48"
    >
      <h2 className="sr-only mb-3 px-2 text-sm font-semibold text-gray-700 md:not-sr-only">
        Categories
      </h2>
      <TabsList
        aria-label="Food categories"
        className="h-auto w-full flex-col items-stretch justify-start gap-1 bg-transparent p-0"
      >
        {categories.map(({ value, label, icon: Icon, flag }) => (
          <TabsTrigger
            key={value}
            value={value}
            title={label ?? value}
            className="h-auto min-h-11 flex-none justify-center gap-3 px-2 py-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 md:justify-start"
          >
            {Icon ? (
              <Icon className="size-5" aria-hidden="true" />
            ) : (
              <img src={flag} alt="" className="h-4 w-5 shrink-0 rounded-sm object-cover" />
            )}
            <span className="sr-only md:not-sr-only">{label ?? value}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </nav>
  );
}
