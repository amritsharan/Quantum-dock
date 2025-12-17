
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // If the user is at the root path, redirect them to the sign-in page.
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const response = NextResponse.next();

  // Allow all origins to frame this page
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  
  // Set a permissive Content-Security-Policy for frame-ancestors
  // This is often needed in development environments or when the app is embedded.
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors * 'unsafe-inline' 'unsafe-eval';"
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
