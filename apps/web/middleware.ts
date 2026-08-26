import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'qi_session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  const base = (process.env.AUTH_API_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

  try {
    const response = await fetch(`${base}/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (response.ok) return NextResponse.next();
  } catch {
    // fail-closed: API indisponível não libera rota protegida
  }

  const redirect = NextResponse.redirect(new URL('/login', request.url));
  redirect.cookies.delete(AUTH_COOKIE);
  return redirect;
}

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|robots.txt).*)']
};
