import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';
import { forgotPassword } from '@/services/auth.service';

const forgotSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
});

type ForgotPayload = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPayload>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }: ForgotPayload) => {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Unable to send the reset email.');
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
            <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {sent ? (
              <p className="text-sm text-center text-gray-300">
                If an account exists for that email, a reset link has been sent. The link expires
                in 1 hour.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <p className="text-sm text-gray-400">
                  Enter your account email and we'll send you a link to reset your password.
                </p>
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

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            <p className="text-sm text-center text-gray-400">
              <Link to="/sign-in" className="underline">
                Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
        <Toaster richColors position="top-center" />
      </main>
    </PageWrapper>
  );
}
