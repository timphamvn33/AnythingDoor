import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { User } from '@/types/user.types';

interface UserInfoCartProps {
  sectionNm: string;
  toggleSection: (section: string) => void;
  isOpen: boolean;
  user: User;
}
export default function UserInfoCart({
  sectionNm,
  toggleSection,
  isOpen,
  user,
}: UserInfoCartProps) {
  return (
    <>
      <Card className="shadow-md">
        <CardHeader
          onClick={() => toggleSection(sectionNm)}
          className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition rounded-t-lg"
        >
          <CardTitle>User Info</CardTitle>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </CardHeader>
        {isOpen && (
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
    </>
  );
}
