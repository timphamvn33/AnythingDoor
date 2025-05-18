'use client';

import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/SideNavbar';
import { ArrowLeftRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function StorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pickupMethod, setPickupMethod] = useState('pickup');
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [price, setPrice] = useState('$');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const renderRating = (stars: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));

  const handleCategoryCheck = (category: string) => {
    setCheckedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
  };

  const resetFilters = () => {
    setCheckedCategories([]);
    setPrice('$');
  };

  return (
    <PageWrapper>
      <Navbar />

      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Toggle Sidebar Button (Mobile Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-16 left-5 z-30 bg-white p-1 rounded-full shadow-md hover:bg-gray-200 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-72 block' : 'w-0 hidden'
          } md:block`}
        >
          <Sidebar
            sidebarOpen={sidebarOpen}
            distance=""
            setDistance={() => {}}
            checkedCategories={checkedCategories}
            handleCategoryCheck={handleCategoryCheck}
            price={price}
            setPrice={setPrice}
            resetFilters={resetFilters}
            customSections={[
              { title: 'Appetizers', items: ['Spring Rolls', 'Mozzarella Sticks'] },
              { title: 'Desserts', items: ['Cheesecake', 'Ice Cream'] },
              { title: 'Beverages', items: ['Soda', 'Iced Tea'] },
            ]}
          />
        </div>

        {/* Main Content */}
        <main className="transition-all duration-300 flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Joe's Deli</h2>
              <p className="text-sm text-gray-600">123 Main St, San Diego, CA</p>
              <div className="flex items-center mt-1">{renderRating(4)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button className="w-28">Checkout</Button>
              <RadioGroup
                defaultValue="pickup"
                onValueChange={setPickupMethod}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Reviews or comments placeholder */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Customer Reviews</h3>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-700">
                “Great food and friendly service. Will definitely come again!” – Alice M.
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-2">Menu Item {i + 1}</h3>
                <p className="text-sm text-gray-500">Delicious description of the item.</p>
                <div className="mt-2 text-right text-base font-medium text-black">$9.99</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </PageWrapper>
  );
}
