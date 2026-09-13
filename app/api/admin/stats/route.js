// app/api/admin/stats/route.js
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
        // Semua query menggunakan parameterized query

        // Total produk aktif
        const productQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
        const productResult = await query(productQuery, []);

        // Total semua order
        const orderQuery = 'SELECT COUNT(*) as total FROM orders';
        const orderResult = await query(orderQuery, []);

        // Total order pending
        const pendingQuery = 'SELECT COUNT(*) as total FROM orders WHERE status = ?';
        const pendingResult = await query(pendingQuery, ['pending']);

        // Total revenue (order selesai)
        const revenueQuery = 'SELECT COALESCE(ROUND(SUM(total_price), 0), 0) as total FROM orders WHERE status = ?';
        const revenueResult = await query(revenueQuery, ['selesai']);

        const stats = {
            totalProducts: parseInt(productResult[0]?.total) || 0,
            totalOrders: parseInt(orderResult[0]?.total) || 0,
            pendingOrders: parseInt(pendingResult[0]?.total) || 0,
            totalRevenue: parseInt(revenueResult[0]?.total) || 0
        };

        return NextResponse.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}