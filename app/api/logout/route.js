// app/api/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    // 🔥 PERBAIKI: await cookies()
    const cookieStore = await cookies();
    
    cookieStore.delete('userId');
    cookieStore.delete('username');
    cookieStore.delete('fullname');
    cookieStore.delete('role');

    return NextResponse.json({
        success: true,
        message: 'Logout berhasil'
    });
}