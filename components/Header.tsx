'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { User, LogOut, Crown, BarChart3 } from 'lucide-react';

export function Header() {
  const { user, signOut, isGuest } = useAuth();

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/upload" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              Chess Opening Trainer
            </Link>
            {(user || isGuest) && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            {isGuest && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/20 border border-amber-800/50 rounded-full text-amber-400 text-sm">
                <Crown className="w-4 h-4" />
                Guest Mode
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="text-gray-300 border-gray-700 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <AuthModal>
                <Button variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </AuthModal>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}