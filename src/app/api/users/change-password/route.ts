import { NextRequest, NextResponse } from 'next/server';
import { updateUserPassword } from '@/app/settings/actions';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { newPassword, confirmPassword } = body;

        if (!newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos.' },
                { status: 400 }
            );
        }

        const result = await updateUserPassword({ newPassword, confirmPassword });

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Return backend clearing info (if available) for client to verify
        return NextResponse.json({ success: true, cleared: (result as any).cleared || null });
    } catch (error: any) {
        console.error('Error in change-password API:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
