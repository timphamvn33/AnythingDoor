import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import { useAuth } from '@/context/auth.context';
import { toast, Toaster } from 'sonner';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginPayload = z.infer<typeof loginSchema>;

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginPayload) => {
    try {
      const res = await login(values);
      console.log('res: ', res);
      if (res.role.includes('restaurant_owner')) {
        console.log('hello owner');
        navigate('/landing/stores/owner', { state: { toastMessage: 'Login successfully!' } });
      } else {
        console.log('hello not owner');
        navigate('/landing', { state: { toastMessage: 'Login successfully!' } });
      }
    } catch (err: any) {
      toast.error(err.message || 'Login Failed');
    }
  };

  return (
    <PageWrapper>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative space-y-6">
        {/* Logo */}
        <Logo />

        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:text-gray-400"
            onClick={() => navigate('/')}
          >
            <X className="w-5 h-5" />
          </Button>

          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="bg-zinc-800 border-white/20 text-white"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="bg-zinc-800 border-white/20 text-white"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>

              <p className="text-sm text-center text-gray-400">
                Don’t have an account?{' '}
                <Link to="/sign-up">
                  <Button variant="link" className="text-stone-50">
                    Sign Up
                  </Button>
                </Link>
              </p>
            </CardContent>
          </form>
        </Card>
        <Toaster richColors position="top-center" />
      </main>
    </PageWrapper>
  );
}
