// app/api/admin/login/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. Brute Force (A07:2021) - Rate Limiting
// TANPA BCRYPT - Password tetap plain text (sesuai penelitian)

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// 🔒 RATE LIMITING (A07:2021)
const adminLoginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = adminLoginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        const firstAttempt = recentAttempts[0];
        const remainingMs = WINDOW_MS - (now - firstAttempt);
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        return { 
            blocked: true, 
            message: `Terlalu banyak percobaan login admin. Coba lagi dalam ${remainingMinutes} menit.`
        };
    }
    
    return { blocked: false };
}

function recordLoginAttempt(ip) {
    const now = Date.now();
    const attempts = adminLoginAttempts.get(ip) || [];
    attempts.push(now);
    const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
    adminLoginAttempts.set(ip, recentAttempts);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        console.log('Admin login attempt:', username);

        // 🔒 Validasi input dasar (A03:2021)
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username dan password harus diisi!' },
                { status: 400 }
            );
        }

        // 🔒 BRUTE FORCE (A07:2021) - Rate Limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        
        const rateLimit = checkRateLimit(ip);
        
        if (rateLimit.blocked) {
            return NextResponse.json(
                { success: false, message: rateLimit.message },
                { status: 429 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?' dan role = 'admin'
        const sql = 'SELECT * FROM users WHERE username = ? AND role = ?';
        const result = await query(sql, [username, 'admin']);

        // Catat percobaan login (A07:2021)
        recordLoginAttempt(ip);

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Username atau password salah, atau bukan akun admin!' },
                { status: 401 }
            );
        }

        const user = result[0];

        // 🔒 VERIFIKASI PASSWORD (LANGSUNG, TANPA BCRYPT)
        // Password disimpan di database dalam bentuk plain text
        if (user.password !== password) {
            return NextResponse.json(
                { success: false, message: 'Username atau password salah, atau bukan akun admin!' },
                { status: 401 }
            );
        }

        // 🔒 Set cookie setelah login sukses
        const cookieStore = await cookies();
        cookieStore.set('userId', String(user.id), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        cookieStore.set('username', user.username, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        cookieStore.set('fullname', user.fullname, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        cookieStore.set('role', user.role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        // 🔒 Reset rate limit setelah login sukses
        adminLoginAttempts.delete(ip);

        return NextResponse.json({
            success: true,
            message: 'Login admin berhasil!',
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, message: 'Error database: ' + error.message },
            { status: 500 }
        );
    }
}