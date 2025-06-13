'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useAuth } from '@/context/auth.context';
import { useNavigate } from 'react-router-dom';
import { deleteOrder, getOrderByUserId, updateOrder } from '@/services/order.service';
import { toast, Toaster } from 'sonner';
import type { Order } from '@/types/order.types';
import OrderSummary from '@/components/cart/OrderSummary';
import UserInfoCart from '@/components/cart/UserInfoCart';
import PaymentMethod from '@/components/cart/PaymentMethod';
import { deleteOrderItem, updateOrderItem } from '@/services/order-items.service';
import type { OrderItem } from '@db/generated/prisma';
import { useCart } from '@/context/cart.context';

export default function CartPage() {
  const [openSections, setOpenSections] = useState<string[]>(['order']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const isOpen = (section: string) => openSections.includes(section);
  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section],
    );
  };
  const { refreshCount } = useCart();

  useEffect(() => {
    if (user?.id) {
      getTheOrderItem();
    }
  }, [user]);

  // get the order item
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
      }
    } catch (error: any) {
      toast.error('unable to get order-items');
    }
  };

  // delete item
  const handleDeleteItem = async (order: Order, itemDelete: OrderItem) => {
    try {
      await deleteOrderItem(itemDelete.id);
      const itemPrice = itemDelete.price * itemDelete.quantity;
      const newTotal = total - itemPrice;

      // set Total order
      const newOrder = { total: newTotal };
      await updateOrder(order.id, newOrder);
      setTotal(newTotal);
      toast.success('Item removed from cart and updated the total');

      // update the item's number on the navbar
      refreshCount();
      // Optimistically update UI
      setOrders(prev =>
        prev.map(order =>
          order.id === order.id
            ? {
                ...order,
                orderItems: order.orderItems.filter(item => item.id !== itemDelete.id),
              }
            : order,
        ),
      );
    } catch (err) {
      toast.error('Failed to delete item or update item');
    }
  };

  // delete order
  const handleDeleteOrder = async () => {
    try {
      const orderId = orders[0].id; // hard code to delete the first order, currently has only 1 order, in future will research more
      await deleteOrder(orderId);
      setTotal(0);
      navigate('/landing');
      refreshCount();
    } catch (error: any) {
      toast.error('unable to delete the order by orderId');
    }
  };

  // update quantity
  const handleQuantityChange = async (
    orderChange: Order,
    orderItem: OrderItem,
    quantityChange: number,
  ) => {
    const orderChangeId = orderChange.id;
    const orderItemId = orderItem.id;
    try {
      const updateOrderItem1 = { quantity: quantityChange };
      const res = await updateOrderItem(orderItemId, updateOrderItem1);
      if (res) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderChangeId
              ? {
                  ...order,
                  orderItems: order.orderItems.map(item =>
                    item.id === orderItemId ? { ...item, quantity: Number(quantityChange) } : item,
                  ),
                }
              : order,
          ),
        );
        // update the total's ui
        const newTotal = total + orderItem.price * (quantityChange - orderItem.quantity);
        setTotal(newTotal);
        // update the item'quantity on Navbar
        refreshCount();
      }
    } catch (error: any) {
      toast.error('unable to update the item quantity');
    }
  };

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

        {/* Order Summary */}
        <OrderSummary
          orders={orders}
          isEditing={isEditing}
          total={total}
          sectionNm="order"
          toggleSection={toggleSection}
          isOpen={isOpen('order')}
          setIsEditing={setIsEditing}
          handleQuantityChange={handleQuantityChange}
          handleDeleteItem={handleDeleteItem}
        />

        {/* User Info Section */}
        <UserInfoCart
          sectionNm="user"
          toggleSection={toggleSection}
          isOpen={isOpen('user')}
          user={user!}
        />

        {/* Payment Method Section */}
        <PaymentMethod
          sectionNm="payment"
          toggleSection={toggleSection}
          isOpen={isOpen('payment')}
        />

        {/* CTA Buttons */}
        <div className="flex flex-col col-end-1 gap-2 pt-6">
          <Button onClick={() => {}}>Proceed to Checkout</Button>
          <Button
            variant={orders?.length === 0 ? 'outline' : 'destructive'}
            disabled={orders?.length === 0}
            onClick={() => {
              handleDeleteOrder();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
