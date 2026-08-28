import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authApiUrl, parseApiError } from '../../../../lib/auth-api';

export async function GET() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Sessão ausente.' }, { status: 401 });

  const response = await fetch(authApiUrl('/operations/overview'), {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!response.ok) {
    const result = NextResponse.json({ message: await parseApiError(response) }, { status: response.status });
    if (response.status === 401 || response.status === 403) result.cookies.delete(AUTH_COOKIE);
    return result;
  }

  return NextResponse.json(await response.json(), { status: 200 });
}
