
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { QuantumDockLogo } from '@/components/quantum-dock/logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';


const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [errorType, setErrorType] = useState<'user-not-found' | 'wrong-password' | 'generic'>('generic');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleAuthError = (error: any) => {
    setIsLoading(false);
    let title = 'Sign In Failed';
    let description = 'An unexpected error occurred. Please try again.';
    let type: 'user-not-found' | 'wrong-password' | 'generic' = 'generic';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        title = 'User Not Found';
        description = `No account found for ${getValues('email')}. Would you like to create one?`;
        type = 'user-not-found';
        break;
      case 'auth/wrong-password':
        title = 'Incorrect Password';
        description = 'The password you entered is incorrect. Please try again.';
        type = 'wrong-password';
        break;
      case 'auth/invalid-credential':
        title = 'Invalid Credentials';
        description = 'The email or password you entered is incorrect. Please try again.';
        type = 'wrong-password';
        break;
      default:
        console.error('Sign in error:', error);
    }
    
    setAlertTitle(title);
    setAlertDescription(description);
    setErrorType(type);
    setShowErrorAlert(true);
  };


  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    signInWithEmailAndPassword(auth, data.email, data.password)
      .then(userCredential => {
        // This is handled by the onAuthStateChanged listener in useUser
      })
      .catch(error => {
        handleAuthError(error);
      });
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsResettingPassword(true);
    sendPasswordResetEmail(auth, data.email)
      .then(() => {
        toast({
            title: 'Password Reset Email Sent',
            description: `If an account exists for ${data.email}, you will receive a password reset link.`,
        });
        setShowForgotPasswordDialog(false);
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Error Sending Reset Email',
          description: error.message || 'An unexpected error occurred.',
        });
      })
      .finally(() => {
        setIsResettingPassword(false);
      });
  };


  if (isUserLoading || user) {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <div className="mb-4 flex flex-col items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="mx-auto h-8 w-40" />
                </div>
                <Skeleton className="mx-auto h-7 w-24" />
                <Skeleton className="mx-auto h-5 w-64" />
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="mx-auto h-5 w-48" />
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex flex-col items-center gap-4">
                <QuantumDockLogo className="h-14 w-14 text-primary" />
                <h1 className="text-3xl font-semibold tracking-tight">QuantumDock</h1>
            </div>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-sm underline"
                  onClick={(e) => {
                    e.preventDefault();
                    forgotPasswordForm.setValue('email', getValues('email'));
                    setShowForgotPasswordDialog(true);
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
               <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
      <Toaster />

      <AlertDialog open={showErrorAlert} onOpenChange={setShowErrorAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {errorType === 'user-not-found' ? (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push(`/sign-up?email=${encodeURIComponent(getValues('email'))}`)}>
                  Create Account
                </AlertDialogAction>
              </>
            ) : (
               <AlertDialogAction onClick={() => setShowErrorAlert(false)}>
                  Close
                </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <AlertDialogContent>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter your email address below and we&apos;ll send you a link to reset your password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="m@example.com"
                    {...forgotPasswordForm.register('email')}
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {forgotPasswordForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel type="button" onClick={() => setShowForgotPasswordDialog(false)}>Cancel</AlertDialogCancel>
                <Button type="submit" disabled={isResettingPassword}>
                  {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </AlertDialogFooter>
            </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
