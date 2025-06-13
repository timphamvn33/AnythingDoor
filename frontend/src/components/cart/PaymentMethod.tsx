import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PaymentMethodProps {
  sectionNm: string;
  toggleSection: (section: string) => void;
  isOpen: boolean;
}
export default function PaymentMethod({ sectionNm, toggleSection, isOpen }: PaymentMethodProps) {
  return (
    <>
      <Card className="shadow-md">
        <CardHeader
          onClick={() => toggleSection(sectionNm)}
          className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
        >
          <CardTitle>Payment Method</CardTitle>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </CardHeader>
        {isOpen && (
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
    </>
  );
}
