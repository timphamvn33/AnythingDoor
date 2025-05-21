'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/SideNavbar';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [distance, setDistance] = useState('');
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [price, setPrice] = useState('$');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const location = useLocation();

  useEffect(() => {
    const toastMsg = location.state?.toastMessage;
    if (toastMsg) {
      toast.success(toastMsg);
    }
  });

  const resetFilters = () => {
    setDistance('');
    setCheckedCategories([]);
    setPrice('$');
  };

  const handleCategoryCheck = (category: string) => {
    setCheckedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
  };

  const handleSearch = () => {
    console.log('Search triggered with:', { selectedCategory, distance, checkedCategories, price });
  };

  const navigate = useNavigate();

  return (
    <PageWrapper>
      <Navbar />
      <Toaster position="top-center" richColors />
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Toggle Button (mobile only) */}
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
            distance={distance}
            setDistance={setDistance}
            checkedCategories={checkedCategories}
            handleCategoryCheck={handleCategoryCheck}
            price={price}
            setPrice={setPrice}
            resetFilters={resetFilters}
          />
        </div>

        {/* Main Content */}
        <main className="transition-all duration-300 flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          <Tabs defaultValue="All" onValueChange={setSelectedCategory}>
            <TabsList className="mb-6">
              {['All', 'Food', 'Groceries', 'Beauty Supply', 'Pets'].map(tab => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/*Search Button */}
            <div className="mb-6 grid grid-cols-2 gap-2">
              <Input
                type="text"
                placeholder="Search..."
                className="bg-white border border-gray-300 focus:border-black focus:ring-0 rounded-xl px-4 py-2 text-base pl-10"
              />
              <Button className="w-20" onClick={handleSearch}>
                Search
              </Button>
            </div>

            <div className="text-gray-700 text-lg font-medium mb-4">
              Showing results for: <span className="text-black">{selectedCategory}</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    <Button variant="link" onClick={() => navigate('/landing/store')}>
                      {selectedCategory} Item {i + 1}
                    </Button>
                  </h3>
                  <p className="text-sm text-gray-500">Description or preview text here.</p>
                </div>
              ))}
            </div>
          </Tabs>
        </main>
      </div>
    </PageWrapper>
  );
}
