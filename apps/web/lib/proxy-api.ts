import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authApiUrl, parseApiError } from './auth-api';

export async function proxyApi(path: string, init: RequestInit = {}) {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Sessão ausente.' }, { status: 401 });

  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');

  const response = await fetch(authApiUrl(path), { ...init, headers, cache: 'no-store' });
  const body = await response.text();
  const result = new NextResponse(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' }
  });

  if (response.status === 401 || response.status === 403) result.cookies.delete(AUTH_COOKIE);
  return result;
}

export async function proxyApiError(response: Response) {
  return NextResponse.json({ message: await parseApiError(response) }, { status: response.status });
}
