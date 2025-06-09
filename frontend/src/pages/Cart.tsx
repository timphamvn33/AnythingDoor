'use client';

import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { formatCurrency } from '@/utils/format';

export default function CartPage() {
  const [openSections, setOpenSections] = useState<string[]>(['order']);
  const { user } = useAuth();

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section],
    );
  };

  const isOpen = (section: string) => openSections.includes(section);

  const cartItems = [
    { name: 'Burger', quantity: 2, price: 5.99 },
    { name: 'Fries', quantity: 1, price: 2.49 },
  ];
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <PageWrapper>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {/* Order Summary Section */}
        <Card className="shadow-md">
          <CardHeader
            onClick={() => toggleSection('order')}
            className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
          >
            <CardTitle>Order Summary</CardTitle>
            {isOpen('order') ? <ChevronUp /> : <ChevronDown />}
          </CardHeader>
          {isOpen('order') && (
            <CardContent className="animate-fadeIn space-y-4">
              <ul className="space-y-2">
                {cartItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.name} (x{item.quantity})
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-4">
                <span>Total:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* User Info Section */}
        <Card className="shadow-md">
          <CardHeader
            onClick={() => toggleSection('user')}
            className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
          >
            <CardTitle>User Info</CardTitle>
            {isOpen('user') ? <ChevronUp /> : <ChevronDown />}
          </CardHeader>
          {isOpen('user') && (
            <CardContent className="animate-fadeIn space-y-2">
              <p>
                <strong>Name:</strong> {user?.name || 'N/A'}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phone || 'N/A'}
              </p>
              <p>
                <strong>Address:</strong> {user?.address || 'N/A'}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Payment Method Section */}
        <Card className="shadow-md">
          <CardHeader
            onClick={() => toggleSection('payment')}
            className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
          >
            <CardTitle>Payment Method</CardTitle>
            {isOpen('payment') ? <ChevronUp /> : <ChevronDown />}
          </CardHeader>
          {isOpen('payment') && (
            <CardContent className="animate-fadeIn space-y-2">
              <p>
                <strong>Payment Type:</strong> Credit Card
              </p>
              <p>
                <strong>Card Holder:</strong> John Doe
              </p>
              <p>
                <strong>Card Number:</strong> **** **** **** 1234
              </p>
              <p>
                <strong>Expiry:</strong> 12/26
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
