import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { ItemPayload } from '@/schemas/item.schema';

type DialogOrderItemProps = {
  open: boolean;
  onClose: () => void;
  item: ItemPayload;
  onAddtoCart: (orderData: {
    itemId: string;
    quantity: number;
    note?: string;
    totalPrice: number;
  }) => void;
};

export default function DialogOrderItem({
  open,
  onClose,
  item,
  onAddtoCart,
}: DialogOrderItemProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNote('');
    }
  }, [open]);

  const handleAddToCart = () => {
    if (quantity < 1) return;

    onAddtoCart({
      itemId: item.id!,
      quantity,
      note,
      totalPrice: quantity * item.price,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Item: {item?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <Textarea
              placeholder="Add any special instructions..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="text-right text-lg font-semibold text-gray-800">
            Total: ${item?.price * quantity}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
          <Button onClick={handleAddToCart}>Buy Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
