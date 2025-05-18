import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-gray-400/80 border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Responsive Logo Position */}
        <div className="text-2xl lg:text-3xl font-semibold lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
          AnythingDoor
        </div>

        {/* Right Side Buttons */}
        <div className="flex gap-4 items-center ml-auto">
          <Button variant="outline" onClick={() => navigate('/sign-in')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/sign-up')}>Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
