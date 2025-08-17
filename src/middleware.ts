import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { corsConfig, isAllowedOrigin } from '@/config/cors';

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  const allowed = isAllowedOrigin(origin);

  // Create response
  const response = NextResponse.next();

  // Set CORS headers
  if (origin && allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback for allowed origins
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Allow-Credentials', corsConfig.allowCredentials.toString());

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths including API routes
     * - api (API routes)
     * - All other routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
