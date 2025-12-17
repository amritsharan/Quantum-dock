
'use client';
import { useState, useEffect, useRef } from 'react';
import { QuantumDockLogo } from '@/components/quantum-dock/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton, Loader2 } from '@/components/ui/skeleton';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isUserLoading, router]);


  const handleSignOut = async () => {
    signOut(auth).then(() => {
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      // The onAuthStateChanged listener will handle the redirect
    }).catch((error) => {
      toast({
        variant: 'destructive',
        title: 'Sign Out Error',
        description: error.message || 'An unexpected error occurred.',
      });
    });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>
        <main className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <QuantumDockLogo className="h-8 w-8 text-primary" />
          <Link
            href="/dashboard"
            className="text-2xl font-semibold text-foreground"
          >
            QuantumDock
          </Link>
        </div>
        <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? 'User avatar'}
                  />
                  <AvatarFallback>
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/history')}>Login History</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      {children}
      <Toaster />
    </div>
  );
}
