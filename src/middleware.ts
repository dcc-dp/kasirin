import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

// Paths that don't require authentication (termasuk SRE Health Probes)
const publicPaths = ['/signin', '/api/auth', '/api/health', '/api/ready'];

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

  // Redirect to appropriate destination if accessing signin with active session
  if (pathname === '/signin' && session) {
    if (session.roleCode === 'KSR') {
      return NextResponse.redirect(new URL('/kasir', request.url));
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // Route Guard: Kasir cannot access /admin routes directly
  if (pathname.startsWith('/admin') && session && session.roleCode === 'KSR') {
    return NextResponse.redirect(new URL('/kasir', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|css|js|.*\\..*).*)'],
};
