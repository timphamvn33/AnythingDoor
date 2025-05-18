import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import clsx from 'clsx';

interface SidebarProps {
  sidebarOpen: boolean;
  distance: string;
  setDistance: (value: string) => void;
  checkedCategories: string[];
  handleCategoryCheck: (category: string) => void;
  price: string;
  setPrice: (value: string) => void;
  resetFilters: () => void;
  customSections?: { title: string; items: string[] }[];
}

const defaultFoodCategories = ['Asian', 'Mexican', 'Pizza', 'Hamburger', 'Italian'];

export default function Sidebar({
  sidebarOpen,
  distance,
  setDistance,
  checkedCategories,
  handleCategoryCheck,
  price,
  setPrice,
  resetFilters,
  customSections,
}: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className={clsx(
        'sticky top-0 h-full overflow-y-auto transition-all duration-300 bg-gray-400/80 border-r shadow-sm px-6 py-8 space-y-6 z-10 w-72',
        {
          'translate-x-0': sidebarOpen,
          '-translate-x-full absolute md:relative': !sidebarOpen,
        },
      )}
    >
      {/* Top Buttons */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-900 hover:text-gray-500 transition"
          title="Home"
        >
          <Home className="w-5 h-5" />
        </button>
        <Button variant="outline" onClick={resetFilters} title="Reset filters">
          Reset
        </Button>
      </div>

      {/* Distance Filter (only for default view) */}
      {!customSections && (
        <div>
          <Label htmlFor="distance" className="text-base font-semibold mb-2 block text-gray-900">
            Distance (miles)
          </Label>
          <Input
            id="distance"
            type="number"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            placeholder="e.g. 10"
            className="border-white/30 bg-white/20 text-gray-900 placeholder-white/70"
          />
        </div>
      )}

      {/* Category or Custom Section Filters */}
      {customSections ? (
        customSections.map(section => (
          <div key={section.title}>
            <p className="text-base font-semibold mb-2 text-gray-900">{section.title}</p>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Checkbox
                    id={item}
                    checked={checkedCategories.includes(item)}
                    onCheckedChange={() => handleCategoryCheck(item)}
                  />
                  <Label htmlFor={item} className="text-gray-900">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div>
          <p className="text-base font-semibold mb-2 text-gray-900">Categories</p>
          <div className="space-y-2">
            {defaultFoodCategories.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  id={item}
                  checked={checkedCategories.includes(item)}
                  onCheckedChange={() => handleCategoryCheck(item)}
                />
                <Label htmlFor={item} className="text-gray-900">
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div>
        <p className="text-base font-semibold mb-2 text-gray-900">Price</p>
        <RadioGroup value={price} onValueChange={setPrice}>
          {['$', '$$'].map((val, idx) => (
            <div key={val} className="flex items-center gap-2">
              <RadioGroupItem value={val} id={`price${idx + 1}`} />
              <Label htmlFor={`price${idx + 1}`} className="text-gray-900">
                {val}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </aside>
  );
}
