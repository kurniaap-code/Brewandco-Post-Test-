// app/api/admin/products/[id]/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// 2. IDOR (A01:2021) - Verifikasi admin

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

// PUT - Update product by ID
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
        const sql = `UPDATE products 
                     SET name = ?, 
                         price = ?, 
                         description = ?, 
                         image_url = ?
                     WHERE id = ?`;
        
        await query(sql, [
            name.trim(),
            parseInt(price),
            description ? description.trim() : '',
            image_url || 'https://placehold.co/150x150?text=Coffee',
            parseInt(id)
        ]);

        return NextResponse.json({
            success: true,
            message: 'Produk berhasil diupdate!'
        });

    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete product by ID
export async function DELETE(request, { params }) {
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

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // ✅ AMAN: Menggunakan placeholder '?'
        const sql = 'DELETE FROM products WHERE id = ?';
        await query(sql, [parseInt(id)]);

        return NextResponse.json({
            success: true,
            message: 'Produk berhasil dihapus!'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json(
            { success: false, error: error.sqlMessage || 'Database error' },
            { status: 500 }
        );
    }
}