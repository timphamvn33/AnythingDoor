import type { ItemPayload } from '@/schemas/item.schema';
import type { StorePayload } from '@/schemas/store.schema';

export interface DemoRestaurant {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: string[];
  openHrs: string;
  closeHrs: string;
  rating: number;
  deliveryTime: string;
  menuItems: ItemPayload[];
}

export const DEMO_RESTAURANTS: DemoRestaurant[] = [
  {
    id: 'demo-golden-wok',
    name: 'Golden Wok',
    description: 'Classic Chinese favorites, freshly prepared.',
    logoUrl: '',
    category: ['Chinese', 'Asian'],
    openHrs: '10:00',
    closeHrs: '22:00',
    rating: 4.8,
    deliveryTime: '20-30 min',
    menuItems: [
      { id: 'demo-wok-noodles', name: 'Sesame Chicken Noodles', description: 'Wok-tossed noodles with sesame chicken and crisp vegetables.', price: 13.5, available: true, imgUrl: '', category: ['Chinese'], restaurantId: 'demo-golden-wok' },
      { id: 'demo-veg-dumplings', name: 'Vegetable Dumplings', description: 'Golden pan-seared dumplings with ginger dipping sauce.', price: 8.25, available: true, imgUrl: '', category: ['Chinese'], restaurantId: 'demo-golden-wok' },
      { id: 'demo-fried-rice', name: 'Garden Fried Rice', description: 'Savory fried rice with egg, peas, carrots, and scallions.', price: 10.75, available: true, imgUrl: '', category: ['Chinese'], restaurantId: 'demo-golden-wok' },
    ],
  },
  {
    id: 'demo-little-italy',
    name: 'Little Italy Pizza',
    description: 'Hand-stretched dough and slow-simmered sauces.',
    logoUrl: '',
    category: ['Pizza', 'Italian'],
    openHrs: '11:00',
    closeHrs: '23:00',
    rating: 4.7,
    deliveryTime: '25-35 min',
    menuItems: [
      { id: 'demo-margherita', name: 'Margherita Pizza', description: 'Tomato, fresh mozzarella, basil, and olive oil.', price: 15, available: true, imgUrl: '', category: ['Pizza'], restaurantId: 'demo-little-italy' },
      { id: 'demo-pepperoni', name: 'Pepperoni Pizza', description: 'Pepperoni and mozzarella over house tomato sauce.', price: 17.5, available: true, imgUrl: '', category: ['Pizza'], restaurantId: 'demo-little-italy' },
      { id: 'demo-garlic-knots', name: 'Garlic Knots', description: 'Oven-baked knots brushed with garlic herb butter.', price: 6.5, available: true, imgUrl: '', category: ['Sides'], restaurantId: 'demo-little-italy' },
    ],
  },
  {
    id: 'demo-green-bowl',
    name: 'Green Bowl Kitchen',
    description: 'Colorful, nourishing bowls made with seasonal ingredients.',
    logoUrl: '',
    category: ['Healthy', 'American'],
    openHrs: '09:00',
    closeHrs: '21:00',
    rating: 4.9,
    deliveryTime: '15-25 min',
    menuItems: [
      { id: 'demo-avocado-bowl', name: 'Avocado Power Bowl', description: 'Brown rice, avocado, greens, chickpeas, and lemon tahini.', price: 12.25, available: true, imgUrl: '', category: ['Healthy'], restaurantId: 'demo-green-bowl' },
      { id: 'demo-crispy-tofu', name: 'Crispy Tofu Bowl', description: 'Crispy tofu, quinoa, crunchy vegetables, and sesame dressing.', price: 13, available: true, imgUrl: '', category: ['Healthy'], restaurantId: 'demo-green-bowl' },
      { id: 'demo-fruit-cup', name: 'Fresh Fruit Cup', description: 'A refreshing mix of seasonal fruit.', price: 5.5, available: true, imgUrl: '', category: ['Healthy'], restaurantId: 'demo-green-bowl' },
    ],
  },
];

export interface DemoCartItem {
  item: ItemPayload;
  quantity: number;
}

const DEMO_CART_KEY = 'anythingdoor-demo-cart';

export const getDemoRestaurant = (id: string) =>
  DEMO_RESTAURANTS.find(restaurant => restaurant.id === id);

export const getDemoCart = (): DemoCartItem[] => {
  try {
    const cart = localStorage.getItem(DEMO_CART_KEY);
    return cart ? (JSON.parse(cart) as DemoCartItem[]) : [];
  } catch (error) {
    console.error('Unable to read the sample cart from local storage', error);
    return [];
  }
};

export const addDemoCartItem = (item: ItemPayload, quantity: number) => {
  const cart = getDemoCart();
  const existingItem = cart.find(cartItem => cartItem.item.id === item.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ item, quantity });
  }

  localStorage.setItem(DEMO_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('demo-cart-updated'));
};

export const updateDemoCartItemQuantity = (itemId: string, quantity: number) => {
  const cart = getDemoCart()
    .map(cartItem => (cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem))
    .filter(cartItem => cartItem.quantity > 0);

  localStorage.setItem(DEMO_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('demo-cart-updated'));
  return cart;
};

export const clearDemoCart = () => {
  localStorage.removeItem(DEMO_CART_KEY);
  window.dispatchEvent(new Event('demo-cart-updated'));
};

export const demoRestaurantAsStore = (restaurant: DemoRestaurant): StorePayload => ({
  id: restaurant.id,
  name: restaurant.name,
  description: restaurant.description,
  logoUrl: restaurant.logoUrl,
  category: restaurant.category,
  openHrs: restaurant.openHrs,
  closeHrs: restaurant.closeHrs,
});
