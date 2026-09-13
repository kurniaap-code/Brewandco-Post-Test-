// app/api/admin/orders/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi admin

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        const role = cookieStore.get('role')?.value;

        // 🔒 VERIFIKASI ADMIN (A01:2021)
        if (!userId || role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = `SELECT o.*, p.name as product_name, p.image_url as product_image, 
                            u.fullname as customer_name, u.username 
                     FROM orders o 
                     JOIN products p ON o.product_id = p.id 
                     JOIN users u ON o.user_id = u.id 
                     ORDER BY o.id DESC`;
        
        const results = await query(sql, []);

        return NextResponse.json({
            success: true,
            orders: results
        });

    } catch (error) {
        console.error('Admin orders error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}