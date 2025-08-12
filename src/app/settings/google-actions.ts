'use server';

import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string; // e.g. https://tusitio.com

if (!CLIENT_ID || !CLIENT_SECRET || !BASE_URL) {
  console.warn('[Google OAuth] Faltan variables de entorno GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXT_PUBLIC_BASE_URL');
}

function buildOAuthClient() {
  return new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    `${BASE_URL.replace(/\/$/, '')}/api/auth/google/callback`
  );
}

export async function getGoogleAuthUrl() {
  try {
    const oauth2Client = buildOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
      'openid',
      'email',
      'profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Necesario para refresh_token
      prompt: 'consent',      // Forzar a Google a mostrar pantalla de consentimiento y devolver refresh_token
      scope: scopes,
      include_granted_scopes: true,
    });

    return { url };
  } catch (e: any) {
    console.error('[getGoogleAuthUrl] Error:', e);
    return { error: 'No se pudo generar la URL de autenticación de Google.' };
  }
}

export async function saveGoogleTokens(code: string) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario no autenticado.' };
    }

    const oauth2Client = buildOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // Google podría no enviar refresh_token si el usuario ya autorizó antes.
      // En ese caso no sobre-escribimos lo existente si ya hay uno.
      console.warn('[saveGoogleTokens] No se recibió refresh_token. Puede que el usuario ya lo haya concedido previamente.');
      // Verificamos si ya existe uno guardado.
      const { data: existing } = await supabase
        .from('google_integrations')
        .select('id, refresh_token')
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return { error: 'No se recibió refresh_token de Google. Revoca el acceso en tu cuenta de Google y vuelve a intentarlo.' };
      }

      return { error: null, reused: true };
    }

    // Upsert (user_id es UNIQUE)
    const { error: upsertError } = await supabase
      .from('google_integrations')
      .upsert({
        user_id: user.id,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[saveGoogleTokens] Error guardando tokens:', upsertError);
      return { error: 'No se pudo guardar el token de Google.' };
    }

    return { error: null };
  } catch (e: any) {
    console.error('[saveGoogleTokens] Error inesperado:', e);
    return { error: 'Error al procesar el token de Google.' };
  }
}
