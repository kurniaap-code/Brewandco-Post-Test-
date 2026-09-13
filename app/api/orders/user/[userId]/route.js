// app/api/orders/user/[userId]/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi akses user

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        // 🔥 PERBAIKI: await params
        const { userId } = await params;
        
        // Ambil cookie
        const cookieStore = await cookies();
        const userIdCookie = cookieStore.get('userId')?.value;
        const role = cookieStore.get('role')?.value;

        // 🔒 VERIFIKASI LOGIN (A01:2021)
        if (!userIdCookie) {
            return NextResponse.json(
                { success: false, message: 'Harap login terlebih dahulu' },
                { status: 401 }
            );
        }

        const requestedUserId = parseInt(userId);

        // 🔒 IDOR PROTECTION (A01:2021)
        // Hanya user sendiri atau admin yang bisa akses
        if (parseInt(userIdCookie) !== requestedUserId && role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Anda tidak memiliki akses ke order ini' },
                { status: 403 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = `SELECT o.*, p.name as product_name, p.price as product_price, p.image_url 
                     FROM orders o 
                     JOIN products p ON o.product_id = p.id 
                     WHERE o.user_id = ? 
                     ORDER BY o.id DESC`;
        
        const results = await query(sql, [requestedUserId]);

        return NextResponse.json({
            success: true,
            orders: results
        });

    } catch (error) {
        console.error('User orders error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}