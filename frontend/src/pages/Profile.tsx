import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, LogOut, X, Phone, Key, Loader2 } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import UserAvatar from '@/components/shared/UserAvtDefault';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  console.log('useAuth context values:', useAuth());
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [userUpdate, setUserUpdate] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: [] as ('buyer' | 'admin' | 'driver' | 'restaurant_owner')[],
  });

  useEffect(() => {
    if (user) {
      setUserUpdate({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role ? (Array.isArray(user.role) ? user.role : [user.role]) : [],
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { state: { toastMessage: 'Signed out successfully!' } });
    } catch (error: any) {
      toast.error('sign out failed: ', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserUpdate(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateUser({
        name: userUpdate.name,
        email: userUpdate.email,
        phone: userUpdate.phone,
        role: userUpdate.role,
      });
      toast.success('User profile updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Toaster position="top-center" richColors />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative space-y-6">
        <Logo />

        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:text-gray-400"
            onClick={() => navigate('/landing')}
          >
            <X className="w-5 h-5" />
          </Button>

          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {user?.name && <UserAvatar name={user.name} />}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <span className="font-semibold text-sm text-white/80">Your Information:</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Name
              </Label>
              <Input
                id="name"
                name="name"
                value={userUpdate.name}
                onChange={handleChange}
                className="bg-zinc-800 border-white/20 text-white"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="email"
                name="email"
                value={userUpdate.email}
                onChange={handleChange}
                className="bg-zinc-800 border-white/20 text-white"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={userUpdate.phone}
                onChange={handleChange}
                className="bg-zinc-800 border-white/20 text-white"
                disabled={loading}
              />
            </div>

            <div>
              <span className="font-semibold text-sm text-white/80">Login Method:</span>

              <div className="space-y-2 mt-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" /> Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={`Using ${user?.loginMethod || 'email/password'}`}
                  className="bg-zinc-800 border-white/20 text-white"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <span className="font-semibold text-sm text-white/80">Account Management:</span>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                <span>Update</span>
              )}
            </Button>

            <Button
              variant="destructive"
              className="w-full border border-red-700 hover:bg-red-700 text-gray-900"
            >
              Delete Account
            </Button>

            <Button
              onClick={handleLogout}
              className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}
