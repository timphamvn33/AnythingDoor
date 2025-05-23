import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User as UserIcon, Mail, LogOut, X, Phone, Key, Loader2 } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import UserAvatar from '@/components/shared/UserAvtDefault';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useForm, useWatch } from 'react-hook-form';
import { fullUserUpdateSchema, type FullUserUpdate } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser, updateUserPasword } = useAuth();
  const [editPassword, setEditPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FullUserUpdate>({
    resolver: zodResolver(fullUserUpdateSchema),
  });

  const watchedFields = useWatch({ control });
  const ableUpdate = Object.entries(watchedFields).some(([key, value]) => {
    return value && value !== (user as any)?.[key];
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setValue('id', user.id);
    }
  }, [user, reset, setValue]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { state: { toastMessage: 'Signed out successfully!' } });
    } catch (error: any) {
      toast.error('sign out failed: ', error);
    }
  };

  const handleUpdate = async (userUpdate: FullUserUpdate) => {
    //Update user info
    console.log('hello udate start');
    if (ableUpdate) {
      try {
        await updateUser({
          name: userUpdate.name,
          email: userUpdate.email,
          phone: userUpdate.phone,
          // role: userUpdate.role,
        });
        console.log('hello uodate info');
        toast.success('Profile updated!', { id: 'profile-toast' });
      } catch (error) {
        toast.error('Failed to update the profile infos.');
      }
    }

    //If password is provided, update it separately
    const inputPassword = userUpdate.password;
    if (editPassword && inputPassword?.trim()) {
      try {
        if (!user?.id) {
          toast.error('Unable to find the user ID for password update!');
        } else {
          await updateUserPasword({
            id: user.id,
            password: inputPassword,
          });
          setTimeout(() => {
            toast.success('Password updated!', { id: 'password-toast' });
          }, 1000);
        }
        setEditPassword(false);
      } catch (error: any) {
        toast.error('Failed to update user or password.');
      }
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
            <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
              <div>
                <span className="font-semibold text-sm text-white/80">Your Information:</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Name
                </Label>
                <Input
                  {...register('name')}
                  id="name"
                  className="bg-zinc-800 border-white/20 text-white"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  {...register('email')}
                  id="email"
                  className="bg-zinc-800 border-white/20 text-white"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  {...register('phone')}
                  id="phone"
                  className="bg-zinc-800 border-white/20 text-white"
                  disabled={isSubmitting}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
              </div>

              <div>
                <span className="font-semibold text-sm text-white/80">Login Method:</span>

                {editPassword && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Key className="w-4 h-4" /> New Password
                    </Label>

                    <Input
                      {...register('password')}
                      id="password"
                      type="password"
                      className="bg-zinc-800 border-white/20 text-white"
                      placeholder="••••••••"
                      disabled={isSubmitting}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  <input {...register('id')} type="hidden" />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  className=" bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => setEditPassword(!editPassword)}
                >
                  {!editPassword && (
                    <div className="flex gap-1 p-1">
                      <Key className="w-4 h-4" />
                      Change Password
                    </div>
                  )}
                  {editPassword && <span>Cancel</span>}
                </Button>
              </div>

              <div>
                <span className="font-semibold text-sm text-white/80">Account Management:</span>
              </div>
              <Button
                type="submit"
                disabled={!ableUpdate || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors duration-200
      ${
        !ableUpdate || isSubmitting
          ? 'bg-gray-100/55 text-gray-600 cursor-not-allowed opacity-50'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
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
            </form>
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
