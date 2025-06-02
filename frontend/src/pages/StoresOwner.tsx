'use client';

import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Star, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StoresOwner() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([
    {
      id: 1,
      name: "Joe's Deli",
      status: 'Open',
      rating: 4,
    },
    {
      id: 2,
      name: 'The Sweet Spot',
      status: 'Closed',
      rating: 5,
    },
    {
      id: 3,
      name: 'Green Bowl',
      status: 'Open',
      rating: 3,
    },
  ]);

  const renderRating = (stars: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const handleAddNewStore = () => {
    // logic for opening create-store dialog (not implemented yet)
    console.log('Open Add New Store Dialog');
  };

  return (
    <PageWrapper>
      <Navbar />

      <main className="p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Stores</h2>
          <Button onClick={handleAddNewStore}>
            <Plus className="w-4 h-4 mr-2" /> Add New Store
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div
              key={store.id}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition"
              onClick={() => navigate('/landing/store')}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold">{store.name}</h3>
                  <p className="text-sm text-gray-600">Status: {store.status}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="w-4 h-4 mr-1" /> Details
                </Button>
              </div>

              <div className="mt-2">{renderRating(store.rating)}</div>
            </div>
          ))}
        </div>
      </main>
    </PageWrapper>
  );
}
