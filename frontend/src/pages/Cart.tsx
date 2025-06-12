'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Home } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { getOrderByUserId } from '@/services/order.service';
import { toast, Toaster } from 'sonner';
import type { Order } from '@/types/order.types';

export default function CartPage() {
  const [openSections, setOpenSections] = useState<string[]>(['order']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section],
    );
  };

  useEffect(() => {
    if (user?.id) {
      getTheOrderItem();
    }
  }, [user]);

  const getTheOrderItem = async () => {
    try {
      const res = await getOrderByUserId(user?.id!);
      if (res) {
        const orders = res.data as Order[];

        //setTotal
        let total = 0;
        orders.forEach(order => {
          total += order.total;
        });
        setTotal(total);

        // setOrders
        setOrders(orders);
        console.log('orderItems: ', res.data?.orderItems);
        console.log('res: ', res);
      }
    } catch (error: any) {
      toast.error('unable to get order-items');
    }
  };

  const isOpen = (section: string) => openSections.includes(section);

  return (
    <PageWrapper>
      <Navbar />
      <Toaster richColors position="top-center" />
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {/* Home Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => {
              navigate('/landing');
            }}
          >
            <Home className="mr-2 w-4 h-4" />
            Home
          </Button>
        </div>

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
              {orders?.map((order, idx) => (
                <>
                  <ul className="space-y-2">
                    <li key={idx} className="flex justify-between">
                      {order?.orderItems.map((item, _) => (
                        <span>
                          {item.menuItem.name} (x{item.quantity})
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </span>
                      ))}
                    </li>
                  </ul>
                </>
              ))}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-4">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => {}}>
                Add More Items
              </Button>
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

        {/* CTA Buttons */}
        <div className="flex flex-col col-end-1 gap-2 pt-6">
          <Button onClick={() => {}}>Proceed to Checkout</Button>
          <Button variant="destructive" onClick={() => {}}>
            Cancel
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
