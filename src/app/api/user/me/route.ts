import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/app/user/actions';

export async function GET() {
    try {
        const userData = await getUserData();
        
        if (!userData || !userData.profile) {
            return NextResponse.json(
                { error: 'Usuario no encontrado.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            profile: userData.profile,
            mustChangePassword: userData.profile.must_change_password || false
        });
    } catch (error: any) {
        console.error('Error in user/me API:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
