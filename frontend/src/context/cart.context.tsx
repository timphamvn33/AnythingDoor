import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.context';
import { getOrderByUserId } from '@/services/order.service';
import type { Order } from '@/types/order.types';

interface CartContextProps {
  cartCount: number;
  refreshCount: () => Promise<void>;
}

const CartContext = createContext<CartContextProps>({ cartCount: 0, refreshCount: async () => {} });

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState<number>(0);

  const refreshCount = async () => {
    if (!user?.id) return;

    try {
      let count = 0;
      const res = await getOrderByUserId(user.id);
      const orders = res.data as Order[];
      orders.forEach(order => {
        count += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      });
      setCartCount(count);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    refreshCount();
  }, [user]);

  return (
    <>
      <CartContext.Provider value={{ cartCount, refreshCount }}>{children}</CartContext.Provider>
    </>
  );
};
