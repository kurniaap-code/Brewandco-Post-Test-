// app/api/admin/products/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi admin

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// GET all products (admin)
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
        const sql = 'SELECT * FROM products ORDER BY id DESC';
        const results = await query(sql, []);

        return NextResponse.json({
            success: true,
            products: results
        });

    } catch (error) {
        console.error('Admin products error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}

// POST create product (admin)
export async function POST(request) {
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

        const body = await request.json();
        const { name, price, description, image_url } = body;

        // 🔒 Validasi input
        if (!name || !price) {
            return NextResponse.json(
                { success: false, message: 'Nama dan harga wajib diisi!' },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = `INSERT INTO products (name, price, description, image_url, is_active) 
                     VALUES (?, ?, ?, ?, 1)`;
        
        const result = await query(sql, [
            name.trim(),
            parseInt(price),
            description ? description.trim() : '',
            image_url || 'https://placehold.co/150x150?text=Coffee'
        ]);

        return NextResponse.json({
            success: true,
            productId: result.insertId,
            message: 'Produk berhasil ditambahkan!'
        });

    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}