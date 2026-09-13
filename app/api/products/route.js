// app/api/products/route.js
// 🔒 IMPLEMENTASI: SQL Injection (A03:2021) - Parameterized Query

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = `SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC`;
        const results = await query(sql, []); // Tidak ada parameter, tapi aman

        return NextResponse.json({
            success: true,
            products: results
        });

    } catch (error) {
        console.error('Products error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}