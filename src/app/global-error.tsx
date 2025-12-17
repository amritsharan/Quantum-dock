
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
              Something went wrong
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              We encountered an unexpected error. Please try again.
            </p>

            {error?.message && (
              <div className="mb-8 w-full rounded-md bg-destructive/10 p-4 text-left text-sm text-destructive">
                <p className="font-bold">Error Details:</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono">
                  {error.message}
                </pre>
              </div>
            )}
            
            <Button onClick={() => reset()}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
