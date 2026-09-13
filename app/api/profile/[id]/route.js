// app/api/profile/[id]/route.js
// 🔒 IMPLEMENTASI: IDOR (A01:2021) - Verifikasi Akses
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        // 🔒 Ambil cookie
        const cookieStore = await cookies();
        const loggedInUserId = cookieStore.get('userId')?.value;

        // 🔒 VERIFIKASI LOGIN (A01:2021)
        if (!loggedInUserId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 🔒 IDOR PROTECTION (A01:2021)
        // Hanya bisa akses data sendiri
        if (parseInt(loggedInUserId) !== userId) {
            return NextResponse.json(
                { success: false, message: 'Forbidden: Cannot access other user data' },
                { status: 403 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        const sql = 'SELECT id, username, fullname, role FROM users WHERE id = ?';
        const users = await query(sql, [userId]);

        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            profile: users[0]
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan sistem' },
            { status: 500 }
        );
    }
}