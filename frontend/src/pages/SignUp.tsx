import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Logo from '@/components/shared/Logo'; // ✅ Import the reusable Logo component

export default function SignUp() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <main className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6">
        {/* Logo */}
        <Logo />

        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          {/* Close button */}
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
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="bg-zinc-800 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-zinc-800 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-800 border-white/20 text-white"
              />
            </div>

            <Button className="w-full bg-white text-black hover:bg-gray-200">Sign Up</Button>

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
      </main>
    </PageWrapper>
  );
}
