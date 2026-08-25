import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authApiUrl, parseApiError } from '../../../../lib/auth-api';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; organizationId?: string };

  const response = await fetch(authApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (!response.ok) {
    return NextResponse.json({ message: await parseApiError(response) }, { status: response.status });
  }

  const payload = (await response.json()) as {
    token: string;
    expiresAt: string;
    [key: string]: unknown;
  };

  const { token, expiresAt, ...safePayload } = payload;
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const result = NextResponse.json(safePayload, { status: 200 });

  result.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  });

  return result;
}
