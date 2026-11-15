'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getCurrentLocation, setCurrentLocation } from '@/services/location.service';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentLocationInput, setCurrentLocationInput] = useState(() => getCurrentLocation());
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const toastMsg = location.state?.toastMessage;
    if (toastMsg) {
      toast.success(toastMsg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleSaveLocation = () => {
    const trimmed = currentLocationInput.trim();
    if (trimmed.length < 3 || trimmed.length > 200) {
      setLocationError('Enter a US address, city and state, or ZIP code.');
      return;
    }
    setCurrentLocation(trimmed);
    navigate('/landing', { state: { discoveryLocation: trimmed } });
  };
  return (
    <>
      <PageWrapper>
        <Navbar />
        <Toaster position="top-center" richColors />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-xl mx-auto">
            {/* Logo */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <Logo />
            </h1>

            {/* Paragraph */}
            <p className="text-lg text-gray-600 mb-6">
              Get your favorite food delivered fast to your doorstep. Simple, convenient, and always
              delicious.
            </p>

            <form
              onSubmit={event => {
                event.preventDefault();
                handleSaveLocation();
              }}
            >
              <div className="mb-4 relative">
                <LocationAutocomplete
                  id="home-location"
                  placeholder="Enter your location"
                  value={currentLocationInput}
                  onChange={value => {
                    setCurrentLocationInput(value);
                    setLocationError('');
                  }}
                  inputClassName="bg-white border border-gray-300 focus:border-black focus:ring-0 rounded-xl px-4 py-2 text-base pl-10"
                />
                <MapPin className="pointer-events-none absolute left-3 top-2 text-gray-400 w-5 h-5" />
              </div>
              {locationError && (
                <p role="alert" className="mb-4 text-sm text-red-700">
                  {locationError}
                </p>
              )}
              <p className="mb-4 text-sm text-gray-600">
                Typing sends your input to Geoapify for US address suggestions. Get Started searches
                for restaurants near your location.
              </p>
              <Button type="submit" className="text-base px-6 py-3 rounded-xl w-full sm:w-auto">
                Get Started
              </Button>
            </form>
          </div>
        </main>
        <Footer />
      </PageWrapper>
    </>
  );
}
