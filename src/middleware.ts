import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

// Paths that don't require authentication
const publicPaths = ['/signin', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Get session
  const session = await getSession();

  // Redirect to signin if accessing protected route without session
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Redirect to dashboard if accessing signin with session
  if (pathname === '/signin' && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // For admin routes, we can't easily check DB permissions here if using mysql2 (edge runtime limitation).
  // We'll do the RBAC permission checks in layout.tsx or server components using a utility function.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|css|js|.*\\..*).*)'],
};
