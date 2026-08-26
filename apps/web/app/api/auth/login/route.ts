import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authApiUrl, parseApiError } from '../../../../lib/auth-api';

type LoginBody = { email?: string; password?: string; organizationId?: string };

function validLoginBody(body: unknown): body is LoginBody {
  if (!body || typeof body !== 'object') return false;
  const value = body as LoginBody;
  if (typeof value.email !== 'string' || value.email.length < 3 || value.email.length > 320) return false;
  if (typeof value.password !== 'string' || value.password.length < 8 || value.password.length > 256) return false;
  if (value.organizationId !== undefined && (typeof value.organizationId !== 'string' || value.organizationId.length > 64)) return false;
  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  if (!validLoginBody(body)) {
    return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(authApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
  } catch {
    return NextResponse.json({ message: 'O serviço de autenticação está temporariamente indisponível.' }, { status: 503 });
  }

  if (!response.ok) {
    return NextResponse.json({ message: await parseApiError(response) }, { status: response.status });
  }

  const payload = (await response.json()) as {
    token?: string;
    expiresAt?: string;
    [key: string]: unknown;
  };

  if (!payload.token || !payload.expiresAt || !Number.isFinite(new Date(payload.expiresAt).getTime())) {
    return NextResponse.json({ message: 'Resposta inválida do serviço de autenticação.' }, { status: 502 });
  }

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
