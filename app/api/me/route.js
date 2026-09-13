// app/api/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    
    const userId = cookieStore.get('userId')?.value;
    const username = cookieStore.get('username')?.value;
    const fullname = cookieStore.get('fullname')?.value;
    const role = cookieStore.get('role')?.value;

    if (userId) {
        return NextResponse.json({
            isLoggedIn: true,
            user: {
                id: parseInt(userId),
                username: username,
                fullname: fullname,
                role: role || 'user'
            }
        });
    } else {
        return NextResponse.json({ isLoggedIn: false });
    }
}