// app/api/login/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. Brute Force (A07:2021) - Rate Limiting + Google reCAPTCHA v2
// TANPA BCRYPT - Password tetap plain text (sesuai penelitian)

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// 🔒 RATE LIMITING (A07:2021)
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        const firstAttempt = recentAttempts[0];
        const remainingMs = WINDOW_MS - (now - firstAttempt);
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        return { 
            blocked: true, 
            message: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingMinutes} menit.`
        };
    }
    
    return { blocked: false };
}

function recordLoginAttempt(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];
    attempts.push(now);
    const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
    loginAttempts.set(ip, recentAttempts);
}

// 🔒 VERIFIKASI GOOGLE reCAPTCHA v2 (A07:2021 - tambahan anti brute force/bot)
async function verifyCaptcha(token, ip) {
    if (!token) {
        return { success: false, message: 'Captcha wajib diverifikasi!' };
    }

    try {
        const params = new URLSearchParams();
        params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
        params.append('response', token);
        if (ip && ip !== 'unknown') {
            params.append('remoteip', ip);
        }

        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await verifyRes.json();

        if (!data.success) {
            return { success: false, message: 'Verifikasi captcha gagal, silakan coba lagi!' };
        }

        return { success: true };
    } catch (error) {
        console.error('Captcha verify error:', error);
        return { success: false, message: 'Gagal memverifikasi captcha, coba lagi nanti.' };
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password, captchaToken } = body;

        // 🔒 Validasi input dasar (A03:2021)
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username dan password harus diisi!' },
                { status: 400 }
            );
        }

        if (username.length < 3 || password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Username minimal 3 karakter, password minimal 6 karakter!' },
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

        // 🔒 CAPTCHA VERIFICATION (A07:2021) - dijalankan sebelum cek kredensial
        const captchaResult = await verifyCaptcha(captchaToken, ip);
        if (!captchaResult.success) {
            // Tetap dicatat sebagai attempt supaya tidak dipakai untuk bypass rate limit
            recordLoginAttempt(ip);
            return NextResponse.json(
                { success: false, message: captchaResult.message },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        const sql = 'SELECT * FROM users WHERE username = ?';
        const result = await query(sql, [username]);

        recordLoginAttempt(ip);

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Username atau password salah!' },
                { status: 401 }
            );
        }

        const user = result[0];

        // 🔒 VERIFIKASI PASSWORD (LANGSUNG, TANPA BCRYPT)
        if (user.password !== password) {
            return NextResponse.json(
                { success: false, message: 'Username atau password salah!' },
                { status: 401 }
            );
        }

        // 🔒 Cegah admin login di halaman user
        if (user.role === 'admin') {
            return NextResponse.json(
                { success: false, message: 'Akun admin! Silakan login melalui halaman admin.' },
                { status: 403 }
            );
        }

        // 🔒 Set cookie
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

        loginAttempts.delete(ip);

        return NextResponse.json({
            success: true,
            message: 'Login berhasil!',
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Error database: ' + error.message },
            { status: 500 }
        );
    }
}
