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
import { useEffect, useState } from 'react';

const categoriesWithImages = [
  { pattern: /pizza/i, icon: Pizza, image: 'pizza.jpg' },
  { pattern: /burger/i, icon: Sandwich, image: 'burger.jpg' },
  { pattern: /sandwich/i, icon: Sandwich, image: 'sandwich.jpg' },
  { pattern: /coffee|cafe|(?:^|[\s_-])tea(?:$|[\s_-])/i, icon: Coffee, image: 'coffee.jpg' },
  { pattern: /dessert|ice[ _-]?cream|sweets/i, icon: IceCreamCone, image: 'dessert.jpg' },
  { pattern: /healthy|vegetarian|vegan|salad/i, icon: Salad, image: 'salad.jpg' },
  { pattern: /sushi|seafood|fish/i, icon: Fish, image: 'sushi.jpg' },
  { pattern: /chicken/i, icon: Drumstick, image: 'chicken.jpg' },
  { pattern: /bakery|pastry|breakfast/i, icon: Croissant, image: 'bakery.jpg' },
  { pattern: /soup/i, icon: Soup, image: 'soup.jpg' },
  { pattern: /noodle|ramen/i, icon: Soup, image: undefined },
  { pattern: /wine|alcohol/i, icon: Wine, image: 'wine.jpg' },
];

function ThumbnailImage({ image }: { image: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    if (status !== 'loading') return;

    const timer = window.setTimeout(
      () => setStatus(previous => (previous === 'loading' ? 'failed' : previous)),
      3000,
    );
    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === 'failed') return null;

  return (
    <img
      src={`${import.meta.env.BASE_URL}images/discovery/${image}`}
      alt=""
      decoding="async"
      className={`absolute inset-0 h-full w-full object-cover ${status === 'loaded' ? '' : 'opacity-0'}`}
      onLoad={() => setStatus(previous => (previous === 'loading' ? 'loaded' : previous))}
      onError={() => setStatus('failed')}
    />
  );
}

export default function RestaurantThumbnail({ categories }: { categories: string[] }) {
  const match = categories
    .map(category => categoriesWithImages.find(({ pattern }) => pattern.test(category)))
    .find(category => category !== undefined);
  const Icon = match?.icon ?? Store;

  return (
    <div
      className="relative flex h-40 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 text-orange-800"
      aria-hidden="true"
    >
      <Icon className="h-16 w-16" strokeWidth={1.5} />
      {match?.image && <ThumbnailImage key={match.image} image={match.image} />}
    </div>
  );
}
