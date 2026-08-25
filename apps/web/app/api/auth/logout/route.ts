import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authApiUrl } from '../../../../lib/auth-api';

export async function POST() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;

  if (token) {
    await fetch(authApiUrl('/auth/logout'), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store'
    }).catch(() => undefined);
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
