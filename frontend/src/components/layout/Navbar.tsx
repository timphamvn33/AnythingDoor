import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { cn } from '@/lib/utils';
import UserAvatar from '../shared/UserAvtDefault';
import { useCart } from '@/context/cart.context';
import { getDemoCart } from '@/data/demo-restaurants';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [demoCartCount, setDemoCartCount] = useState(() =>
    getDemoCart().reduce((count, cartItem) => count + cartItem.quantity, 0),
  );

  useEffect(() => {
    const updateDemoCartCount = () => {
      setDemoCartCount(
        getDemoCart().reduce((count, cartItem) => count + cartItem.quantity, 0),
      );
    };
    window.addEventListener('demo-cart-updated', updateDemoCartCount);
    return () => window.removeEventListener('demo-cart-updated', updateDemoCartCount);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gray-400/80 border-b shadow-sm">
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
              {demoCartCount > 0 && (
                <Button variant="outline" onClick={() => navigate('/landing/cart')}>
                  Cart ({demoCartCount})
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="relative"
                  onClick={() =>
                    cartCount + demoCartCount > 0 ? navigate('/landing/cart') : undefined
                  }
                >
                  {/* Badge */}
                  {cartCount + demoCartCount > 0 && (
                    <span className="absolute -top-1 -left-1 z-10 inline-flex items-center justify-center rounded-full bg-destructive text-white text-xs font-semibold h-5 w-5">
                      {cartCount + demoCartCount}
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
