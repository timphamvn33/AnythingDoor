import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import { resetPassword } from '@/services/auth.service';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(64, { message: 'Password must be at most 64 characters' })
      .regex(/[a-z]/, { message: 'Include a lowercase letter' })
      .regex(/[A-Z]/, { message: 'Include an uppercase letter' })
      .regex(/\d/, { message: 'Include a number' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPayload = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPayload>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }: ResetPayload) => {
    if (!token) return;
    try {
      await resetPassword(token, password);
      navigate('/sign-in', { state: { toastMessage: 'Password reset! Please sign in.' } });
    } catch (err: any) {
      toast.error(err.message || 'Unable to reset the password.');
    }
  };

  return (
    <PageWrapper>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative space-y-6">
        <Logo />

        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:text-gray-400"
            onClick={() => navigate('/sign-in')}
          >
            <X className="w-5 h-5" />
          </Button>

          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {!token ? (
              <p className="text-sm text-center text-red-400">
                This reset link is invalid.{' '}
                <Link to="/forgot-password" className="underline">
                  Request a new one
                </Link>
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> New Password
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
                  <p className="text-xs text-gray-400">
                    At least 8 characters with an uppercase letter, a lowercase letter, and a number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-white/20 text-white"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Toaster richColors position="top-center" />
      </main>
    </PageWrapper>
  );
}
