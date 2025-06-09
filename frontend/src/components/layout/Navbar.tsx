import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { cn } from '@/lib/utils';
import UserAvatar from '../shared/UserAvtDefault';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => navigate('/landing/cart')}
                  className={cn(
                    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'h-10 w-10 p-2',
                  )}
                >
                  <ShoppingCart className="h-10 w-10  stroke-[2]" />
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
