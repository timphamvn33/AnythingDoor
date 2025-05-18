'use client';

import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Logo from '@/components/shared/Logo';

export default function SignIn() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 relative space-y-6">
        {/* Logo */}
        <Logo />

        {/* Sign In Card */}
        <Card className="w-full max-w-md border-white/10 bg-zinc-900/85 text-white shadow-lg relative">
          {/* X Button */}
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

          <CardContent className="space-y-6">
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

            <Button className="w-full bg-white text-black hover:bg-gray-200">Sign In</Button>

            <p className="text-sm text-center text-gray-400">
              Don’t have an account?{' '}
              <Link to="/sign-up">
                <Button variant="link" className="text-stone-50">
                  Sign Up
                </Button>
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}
