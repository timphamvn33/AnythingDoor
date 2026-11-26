import {
  Coffee,
  Croissant,
  Drumstick,
  Fish,
  IceCreamCone,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Store,
  Wine,
} from 'lucide-react';

const categoryIcons = [
  { pattern: /pizza/i, icon: Pizza },
  { pattern: /burger/i, icon: Sandwich },
  { pattern: /sandwich/i, icon: Sandwich },
  { pattern: /coffee|cafe|(?:^|[\s_-])tea(?:$|[\s_-])/i, icon: Coffee },
  { pattern: /dessert|ice[ _-]?cream|sweets/i, icon: IceCreamCone },
  { pattern: /healthy|vegetarian|vegan|salad/i, icon: Salad },
  { pattern: /sushi|seafood|fish/i, icon: Fish },
  { pattern: /chicken/i, icon: Drumstick },
  { pattern: /bakery|pastry|breakfast/i, icon: Croissant },
  { pattern: /soup/i, icon: Soup },
  { pattern: /noodle|ramen/i, icon: Soup },
  { pattern: /wine|alcohol/i, icon: Wine },
];

export default function RestaurantThumbnail({ categories }: { categories: string[] }) {
  const match = categories
    .map(category => categoryIcons.find(({ pattern }) => pattern.test(category)))
    .find(category => category !== undefined);
  const Icon = match?.icon ?? Store;

  return (
    <div
      className="relative flex h-40 items-center justify-center bg-gray-200 text-gray-500"
      aria-hidden="true"
    >
      <Icon className="h-16 w-16" strokeWidth={1.5} />
    </div>
  );
}
