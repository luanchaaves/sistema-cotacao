import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Optional: Restrict /admin to specific domain if ADMIN_HOST environment variable is configured
  const allowedAdminHost = process.env.ADMIN_HOST; // e.g. "gestao.roboledpartner.com.br"
  if (allowedAdminHost && pathname.startsWith('/admin') && !host.includes(allowedAdminHost) && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    // Return 404 Not Found on unauthorized domains attempting to scan for /admin
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
