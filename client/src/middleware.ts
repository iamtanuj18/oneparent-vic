import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for login page and static assets
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/images') ||
    request.nextUrl.pathname.startsWith('/data')
  ) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('oneParentAuth');
  
  if (!authCookie || authCookie.value !== 'verified') {
    // Redirect to login page if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    
    '/((?!login|_next/static|_next/image|favicon.ico|images|data|api).*)',
  ],
};