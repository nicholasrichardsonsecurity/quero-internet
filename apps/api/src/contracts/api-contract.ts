export const API_CONTRACT = {
  version: 'v1',
  date: '2026-09-01',
  versionHeader: 'x-api-version',
  requestIdHeader: 'x-request-id'
} as const;

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    statusCode: number;
    path: string;
    timestamp: string;
    requestId?: string;
  };
}

export function errorCodeForStatus(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'RESOURCE_NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 429) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}

export function safeErrorMessage(statusCode: number, message: unknown): string {
  if (statusCode >= 500) return 'Erro interno ao processar a requisição.';
  if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message.join('; ');
  return 'Não foi possível processar a requisição.';
}
