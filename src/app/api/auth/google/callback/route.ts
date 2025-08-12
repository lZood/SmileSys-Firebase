import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleTokens } from '@/app/settings/google-actions';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?google-auth=error`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?google-auth=error`);
  }

  const result = await saveGoogleTokens(code);
  if (result.error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?google-auth=error`);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?google-auth=success`);
}
