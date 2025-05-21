import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupPayload } from '@/schemas/auth.schema';
import { useAuth } from '@/context/auth.context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import { toast, Toaster } from 'sonner';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupPayload>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupPayload) => {
    try {
      await signup(data);
      navigate('/landing', { state: { toastMessage: 'Sign up successfully!' } });
    } catch (err: any) {
      console.error('Signup failed', err);
      toast.error(err.message || 'Failed to Sign Up, Try Again!');
    }
  };

  return (
    <PageWrapper>
      <main className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6">
        <Logo />
        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          <button
            onClick={() => navigate('/')}
            className="absolute right-4 top-4 text-white hover:text-gray-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                <Input {...register('name')} id="name" placeholder="John Doe" />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input {...register('phone')} id="phone" placeholder="1234567890" />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>

                <div className="flex flex-col gap-2">
                  {['buyer', 'admin', 'driver', 'restaurant_owner'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        value={role}
                        {...register('role', { required: 'At least one role is required' })}
                        className="accent-white"
                      />
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  ))}
                </div>

                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>

              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {isSubmitting ? 'Creating...' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-400">
              Already have an account?{' '}
              <Link to="/sign-in">
                <Button variant="link" className="text-stone-50">
                  Sign In
                </Button>
              </Link>
            </p>
          </CardContent>
        </Card>
        <Toaster richColors position="top-center" />
      </main>
    </PageWrapper>
  );
}
