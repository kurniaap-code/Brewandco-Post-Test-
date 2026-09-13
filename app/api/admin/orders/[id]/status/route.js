// app/api/admin/orders/[id]/status/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi admin
// 3. Brute Force (A07:2021) - Validasi status

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
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

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // 🔒 Validasi status (A07:2021)
        const validStatus = ['pending', 'proses', 'selesai'];
        if (!status || !validStatus.includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Status tidak valid! Gunakan: pending, proses, atau selesai' },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = 'UPDATE orders SET status = ? WHERE id = ?';
        await query(sql, [status, id]);

        return NextResponse.json({
            success: true,
            message: `Status order #${id} berhasil diupdate menjadi ${status}`
        });

    } catch (error) {
        console.error('Update order status error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}