'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const toastMsg = location.state?.toastMessage;
    if (toastMsg) {
      toast.success(toastMsg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
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

            {/* Location Input */}
            <div className="mb-4 relative">
              {/* Icon */}
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

              {/* Input with left padding */}
              <Input
                type="text"
                placeholder="Enter your location"
                className="bg-white border border-gray-300 focus:border-black focus:ring-0 rounded-xl px-4 py-2 text-base pl-10"
              />
            </div>

            {/* CTA Button */}
            <Button
              className="text-base px-6 py-3 rounded-xl w-full sm:w-auto"
              onClick={() => navigate('/landing')}
            >
              Get Started
            </Button>
          </div>
        </main>
        <Footer />
      </PageWrapper>
    </>
  );
}
