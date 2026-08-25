export const AUTH_COOKIE = 'qi_session';

export function authApiUrl(path: string): string {
  const base = process.env.AUTH_API_URL ?? 'http://127.0.0.1:3001';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function parseApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(' ');
    if (typeof body.message === 'string') return body.message;
  } catch {
    // resposta não JSON
  }

  return 'Não foi possível concluir a autenticação.';
}
