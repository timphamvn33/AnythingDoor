import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { cn } from '@/lib/utils';
import UserAvatar from '../shared/UserAvtDefault';
import { useEffect, useState } from 'react';
import { getOrderByUserId } from '@/services/order.service';
import { toast, Toaster } from 'sonner';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    getTheOrderItem();
  }, [user]);

  const getTheOrderItem = async () => {
    try {
      const res = await getOrderByUserId(user?.id!);

      if (res && Array.isArray(res.data)) {
        const allItems = res.data.flatMap(order => order.orderItems ?? []);
        setItemCount(allItems.reduce((acc, item) => acc + item.quantity, 0)); // Total quantity
        setIsCartOpen(allItems.length > 0);
      } else {
        setItemCount(0);
        setIsCartOpen(false);
      }
    } catch (error: any) {
      toast.error('unable to get order-items');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-400/80 border-b shadow-sm">
      <Toaster richColors position="top-center" />
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Responsive Logo Position */}
        <div className="text-2xl lg:text-3xl font-semibold lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
          AnythingDoor
        </div>

        {/* Right Side Buttons / Icons */}
        <div className="flex gap-4 items-center ml-auto">
          {!user ? (
            <>
              <Button variant="outline" onClick={() => navigate('/sign-in')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/sign-up')}>Sign Up</Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="relative"
                  onClick={() => (isCartOpen ? navigate('/landing/cart') : '')}
                >
                  {/* Badge */}
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -left-1 z-10 inline-flex items-center justify-center rounded-full bg-destructive text-white text-xs font-semibold h-5 w-5">
                      {itemCount}
                    </span>
                  )}
                  <div
                    className={cn(
                      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'h-10 w-10 p-2',
                    )}
                  >
                    <ShoppingCart className="h-6 w-6 stroke-[2]" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/profile')}
                  className={cn(
                    'rounded-full cursor-pointer transition-colors',
                    'w-10 h-10 flex items-center justify-center',
                  )}
                >
                  <UserAvatar name={user?.name || ''} className="hover:bg-black hover:text-white" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
