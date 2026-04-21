'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { User, LogOut, Crown, BarChart3, Settings } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

export function Header() {
  const { user, signOut, isGuest } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-3 rounded-xl text-white transition-opacity hover:opacity-90">
              <LogoMark className="h-10 w-10 sm:h-11 sm:w-11" sizes="44px" priority />
              <div className="leading-tight">
                <span className="block text-sm font-semibold sm:text-base">OpeningMaster</span>
                <span className="hidden text-xs text-gray-400 sm:block">Chess opening training</span>
              </div>
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
            {pathname === '/training' && (
              <Link href="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 px-2 text-xs text-gray-300 hover:bg-gray-800 sm:px-3 sm:text-sm"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Settings
                </Button>
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 px-2 text-xs text-gray-300 hover:bg-gray-800 sm:px-3 sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Sign Out</span>
                  <span className="xs:hidden">Out</span>
                </Button>
              </div>
            ) : (
              <AuthModal>
                <Button variant="outline" className="border-gray-700 px-2 text-xs text-gray-300 hover:bg-gray-800 sm:px-3 sm:text-sm">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Sign In</span>
                  <span className="xs:hidden">In</span>
                </Button>
              </AuthModal>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
