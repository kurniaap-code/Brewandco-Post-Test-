// app/api/register/route.js
// 🔒 IMPLEMENTASI:
// 1. SQL Injection (A03:2021) - Parameterized Query
// TANPA BCRYPT - Password tetap plain text (sesuai penelitian)

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 🔒 Validasi input manual
function validateInput(fullname, username, password) {
    if (!fullname || fullname.trim().length < 3) {
        return { valid: false, message: 'Nama lengkap minimal 3 karakter' };
    }
    if (!username || username.trim().length < 3) {
        return { valid: false, message: 'Username minimal 3 karakter' };
    }
    if (!password || password.length < 6) {
        return { valid: false, message: 'Password minimal 6 karakter' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, message: 'Username hanya boleh huruf, angka, dan underscore' };
    }
    return { valid: true };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { fullname, username, password } = body;

        // 🔒 Validasi input (A03:2021)
        const validation = validateInput(fullname, username, password);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, message: validation.message },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        const checkQuery = 'SELECT * FROM users WHERE username = ?';
        const result = await query(checkQuery, [username.trim()]);

        if (result.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Username sudah terdaftar!' },
                { status: 400 }
            );
        }

        // 🔒 SQL INJECTION (A03:2021) - Parameterized Query
        // Password disimpan plain text (sesuai penelitian)
const insertQuery = `INSERT INTO users (fullname, username, password, role) 
                     VALUES (?, ?, ?, 'user')`;

await query(insertQuery, [
    fullname.trim(),    // fullname
    username.trim(),    // username
    password            // password
]);

        return NextResponse.json({
            success: true,
            message: 'Registrasi berhasil! Silakan login.'
        });

    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { success: false, message: 'Error database: ' + error.message },
            { status: 500 }
        );
    }
}
