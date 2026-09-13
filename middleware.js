// middleware.js
// 🔒 IMPLEMENTASI: IDOR (A01:2021) - Verifikasi Akses
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 🔒 Route yang membutuhkan login
const PROTECTED_ROUTES = [
    '/dashboard',
    '/profile',
    '/settings',
    '/cart',
    '/checkout',
    '/orders'
];

// 🔒 Route yang hanya untuk admin (TANPA admin/login)
const ADMIN_ROUTES = [
    '/admin/dashboard',
    '/admin/orders',
    '/admin/products',
    '/admin/users',
    '/admin/stats'
];

// 🔒 Route API yang hanya untuk admin
const ADMIN_API_ROUTES = [
    '/api/admin/orders',
    '/api/admin/products',
    '/api/admin/stats'
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // 🔥 TAMBAHKAN INI: Admin login HARUS bisa diakses TANPA login
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    // 🔒 Ambil cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const userRole = cookieStore.get('role')?.value;

    // Cek protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
    const isAdminApiRoute = ADMIN_API_ROUTES.some(route => pathname.startsWith(route));

    // 🔒 A01:2021 - Verifikasi login untuk protected routes
    if (isProtectedRoute && !userId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 🔒 A01:2021 - Verifikasi admin untuk admin routes
    if (isAdminRoute && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 🔒 A01:2021 - Verifikasi admin untuk admin API routes
    if (isAdminApiRoute && userRole !== 'admin') {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 🔒 A01:2021 - IDOR Protection: Profile
    const profileMatch = pathname.match(/^\/profile\/(\d+)$/);
    if (profileMatch) {
        const profileUserId = profileMatch[1];
        if (userId && profileUserId !== userId) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // 🔒 A01:2021 - IDOR Protection: API Orders
    const apiOrdersMatch = pathname.match(/^\/api\/orders\/user\/(\d+)$/);
    if (apiOrdersMatch) {
        const targetUserId = apiOrdersMatch[1];
        if (!userId) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }
        if (userId !== targetUserId && userRole !== 'admin') {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Forbidden: Cannot access other user orders' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    return NextResponse.next();
}

// 🔒 Konfigurasi route yang dicek
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/settings/:path*',
        '/cart/:path*',
        '/checkout/:path*',
        '/orders/:path*',
        '/admin/:path*',
        '/api/orders/user/:path*',
        '/api/admin/:path*'
    ]
};