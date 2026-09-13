// app/api/orders/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi akses user

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        // 🔒 VERIFIKASI LOGIN (A01:2021)
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Harap login terlebih dahulu' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { product_id, quantity, notes, total_price, customer_name, customer_phone, customer_address } = body;

        // 🔒 Validasi input dasar
        if (!product_id || !quantity || !total_price) {
            return NextResponse.json(
                { success: false, message: 'Product ID, quantity, dan total price harus diisi!' },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = `INSERT INTO orders (user_id, product_id, quantity, notes, total_price, customer_name, customer_phone, customer_address, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
        
        const result = await query(sql, [
            parseInt(userId),
            parseInt(product_id),
            parseInt(quantity),
            notes || null,
            parseFloat(total_price),
            customer_name || null,
            customer_phone || null,
            customer_address || null
        ]);

        return NextResponse.json({
            success: true,
            orderId: result.insertId,
            message: 'Order berhasil dibuat!'
        });

    } catch (error) {
        console.error('Order error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}