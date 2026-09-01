import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ObservabilityService } from './observability.service';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function headerValue(value: string | string[] | undefined): string | undefined {
  const item = Array.isArray(value) ? value[0] : value;
  return item && SAFE_ID.test(item) ? item : undefined;
}

export function observabilityMiddleware(observability: ObservabilityService) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const requestId = headerValue(request.headers['x-request-id']) ?? randomUUID();
    const correlationId = headerValue(request.headers['x-correlation-id']) ?? requestId;
    const startedAt = process.hrtime.bigint();

    response.setHeader('x-request-id', requestId);
    response.setHeader('x-correlation-id', correlationId);

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      observability.observe(response.statusCode, durationMs);
      console.log(JSON.stringify({
        event: 'http.request',
        requestId,
        correlationId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        at: new Date().toISOString()
      }));
    });

    next();
  };
}
