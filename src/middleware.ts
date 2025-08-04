import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { EdgeAuthValidator } from '@/lib/backend/utils/edgeAuth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes that don't need auth and static assets
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && 
      !pathname.startsWith('/api/chef/') && !pathname.startsWith('/api/delivery/') && 
      !pathname.startsWith('/api/users/')) {
    return NextResponse.next();
  }
  
  // Skip middleware for static assets and Next.js internals
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.startsWith('/images/') ||
      pathname.startsWith('/.well-known/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Temporarily allow dashboard routes to pass through - let components handle auth
  if (pathname === '/chef/dashboard' || pathname === '/delivery/dashboard' || pathname === '/dashboard') {
    return NextResponse.next();
  }
  
  // Validate session using JWT (Edge Runtime compatible)
  const sessionValidation = EdgeAuthValidator.getUserFromRequest(request);
  const user = sessionValidation.isValid ? sessionValidation.user : null;

  // STRICT ROLE-BASED SEPARATION (NO MIXING ALLOWED)
  if (user) {
    console.log('🔐 Middleware check:', { role: user.role, pathname });

    // For dashboard routes, allow direct access for now and let component handle auth
    if (pathname === '/chef/dashboard' && user.role === 'chef') {
      return NextResponse.next();
    }
    if (pathname === '/delivery/dashboard' && user.role === 'delivery') {
      return NextResponse.next();
    }
    if (pathname === '/dashboard' && (user.role === 'customer' || user.role === 'user')) {
      return NextResponse.next();
    }

    // CHEF ROLE: Allow auth pages but block protected customer/delivery routes
    if (user.role === 'chef') {
      // Allow access to customer auth pages so chefs can logout and switch roles
      const customerAuthPages = ['/login', '/register'];
      const deliveryAuthPages = ['/delivery/login', '/delivery/register'];
      const authPages = [...customerAuthPages, ...deliveryAuthPages];
      
      if (authPages.includes(pathname)) {
        console.log('✅ Chef allowed to access auth page for role switching:', pathname);
        return NextResponse.next();
      }
      
      // Block chef from protected customer and delivery routes (but not auth pages)
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/delivery/') ||
          pathname.startsWith('/orders') || 
          pathname.startsWith('/profile')) {
        console.log('❌ Chef blocked from protected route:', pathname);
        return NextResponse.redirect(new URL('/chef/dashboard', request.url));
      }
    }

    // DELIVERY ROLE: Allow auth pages but block protected customer/chef routes
    if (user.role === 'delivery') {
      // Allow access to customer and chef auth pages so delivery agents can logout and switch roles
      const customerAuthPages = ['/login', '/register'];
      const chefAuthPages = ['/chef/login', '/chef/register'];
      const deliveryAuthPages = ['/delivery/login', '/register-delivery'];
      const authPages = [...customerAuthPages, ...chefAuthPages, ...deliveryAuthPages];
      
      if (authPages.includes(pathname)) {
        console.log('✅ Delivery agent allowed to access auth page for role switching:', pathname);
        return NextResponse.next();
      }
      
      // Block delivery agent from protected customer and chef routes (but not auth pages)
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/chef/') ||
          pathname.startsWith('/orders') || 
          pathname.startsWith('/profile')) {
        console.log('❌ Delivery agent blocked from protected route:', pathname);
        return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
      }
    }

    // CUSTOMER ROLE: Allow auth pages but block protected chef routes
    if (user.role === 'customer' || user.role === 'user') {
      // Allow access to auth pages so users can logout and switch roles
      const chefAuthPages = ['/chef/login', '/chef/register'];
      const deliveryAuthPages = ['/delivery/login', '/register-delivery'];
      const authPages = [...chefAuthPages, ...deliveryAuthPages];
      
      if (authPages.includes(pathname)) {
        console.log('✅ Customer allowed to access auth page for role switching:', pathname);
        return NextResponse.next();
      }
      
      // Block customer from protected chef routes (but not auth pages)
      if (pathname.startsWith('/chef/') && !chefAuthPages.includes(pathname)) {
        console.log('❌ Customer blocked from protected chef route:', pathname);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // This section was replaced by the improved logic above

    // ADMIN ROLE: Only allow admin routes
    if (user.role === 'admin' && !pathname.startsWith('/admin/')) {
      console.log('❌ Admin redirected to admin dashboard:', pathname);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // SEPARATE PUBLIC ROUTES FOR EACH ROLE TYPE
  const publicRoutes = ['/chef-services', '/', '/api/chef-services/chefs'];
  const customerPublicRoutes = ['/login', '/register'];
  const chefPublicRoutes = ['/chef/login', '/chef/register'];
  const deliveryPublicRoutes = ['/delivery/login', '/delivery/register'];
  
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isCustomerPublicRoute = customerPublicRoutes.some(route => pathname === route);
  const isChefPublicRoute = chefPublicRoutes.some(route => pathname === route);
  const isDeliveryPublicRoute = deliveryPublicRoutes.some(route => pathname === route);

  // Allow all authenticated users to access any auth pages for role switching
  // This enables users to logout and login as different roles

  // ROLE-SPECIFIC PROTECTED ROUTES
  const customerProtectedRoutes = ['/dashboard', '/profile', '/orders'];
  const chefProtectedRoutes = ['/chef/dashboard'];
  const deliveryProtectedRoutes = ['/delivery/dashboard'];
  const adminProtectedRoutes = ['/admin/'];
  
  const isCustomerProtectedRoute = customerProtectedRoutes.some(route => pathname.startsWith(route));
  const isChefProtectedRoute = chefProtectedRoutes.some(route => pathname.startsWith(route));
  const isDeliveryProtectedRoute = deliveryProtectedRoutes.some(route => pathname.startsWith(route));
  const isAdminProtectedRoute = adminProtectedRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users to appropriate login
  if (!user) {
    if (isChefProtectedRoute) {
      console.log('🔒 Redirecting to chef login');
      return NextResponse.redirect(new URL('/chef/login', request.url));
    }
    
    if (isDeliveryProtectedRoute) {
      console.log('🔒 Redirecting to delivery login');
      return NextResponse.redirect(new URL('/delivery/login', request.url));
    }
    
    if (isCustomerProtectedRoute) {
      console.log('🔒 Redirecting to customer login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (isAdminProtectedRoute) {
      console.log('🔒 Redirecting to admin login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};