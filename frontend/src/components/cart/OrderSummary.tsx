import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/types/order.types';
import { formatCurrency } from '@/utils/format';
import type { OrderItem } from '@db/generated/prisma';

interface OrderSummaryProps {
  orders: Order[];
  isEditing: boolean;
  total: number;
  isOpen: boolean;
  sectionNm: string;
  toggleSection: (section: string) => void;
  setIsEditing: (prev: any) => void;
  handleQuantityChange: (order: Order, orderItem: OrderItem, quantityChange: number) => void;
  handleDeleteItem: (order: Order, item: OrderItem) => void;
}

export default function OrderSummary({
  orders,
  isEditing,
  total,
  isOpen,
  sectionNm,
  toggleSection,
  setIsEditing,
  handleQuantityChange,
  handleDeleteItem,
}: OrderSummaryProps) {
  return (
    <>
      {/* Order Summary Section */}
      <Card className="shadow-md">
        <CardHeader
          onClick={() => toggleSection(sectionNm)}
          className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
        >
          <CardTitle>Order Summary</CardTitle>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </CardHeader>
        {isOpen && (
          <CardContent className="animate-fadeIn space-y-4">
            {orders?.map((order, _) => (
              <>
                <ul className="space-y-2">
                  {order?.orderItems.map((item, itemIdx) => (
                    <li
                      key={item.id || itemIdx}
                      className="flex justify-between items-center gap-4 bg-muted px-4 py-2 rounded-md"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{item.menuItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantity:{' '}
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e =>
                                handleQuantityChange(order, item, parseInt(e.target.value))
                              }
                              className="w-16 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            `x${item.quantity}`
                          )}
                        </div>
                        <div className="text-sm">{formatCurrency(item.price * item.quantity)}</div>
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => handleDeleteItem(order, item)}
                          className="hover:text-red-600 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ))}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-4">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <Button variant="outline" className="m-4" onClick={() => {}}>
              Add More Items
            </Button>
            <Button
              className="m-4"
              variant={isEditing ? 'secondary' : 'default'}
              onClick={() => setIsEditing((prev: any) => !prev)}
            >
              {isEditing ? 'Done Editing' : 'Edit Items'}
            </Button>
          </CardContent>
        )}
      </Card>
    </>
  );
}
