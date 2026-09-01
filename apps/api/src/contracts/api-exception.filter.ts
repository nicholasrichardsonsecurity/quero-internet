import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { API_CONTRACT, errorCodeForStatus, safeErrorMessage, type ApiErrorEnvelope } from './api-contract';

interface HttpExceptionResponseBody {
  message?: unknown;
}

interface HttpRequestLike {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface HttpResponseLike {
  status(statusCode: number): { json(body: ApiErrorEnvelope): void };
}

function exceptionStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function exceptionMessage(exception: unknown, statusCode: number): string {
  if (!(exception instanceof HttpException)) return safeErrorMessage(statusCode, null);

  const response = exception.getResponse();
  if (typeof response === 'string') return safeErrorMessage(statusCode, response);
  if (response && typeof response === 'object' && 'message' in response) {
    return safeErrorMessage(statusCode, (response as HttpExceptionResponseBody).message);
  }
  return safeErrorMessage(statusCode, exception.message);
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponseLike>();
    const request = ctx.getRequest<HttpRequestLike>();
    const statusCode = exceptionStatus(exception);
    const requestId = firstHeaderValue(request.headers[API_CONTRACT.requestIdHeader]);

    const body: ApiErrorEnvelope = {
      error: {
        code: errorCodeForStatus(statusCode),
        message: exceptionMessage(exception, statusCode),
        statusCode,
        path: request.url,
        timestamp: new Date().toISOString(),
        ...(requestId ? { requestId } : {})
      }
    };

    response.status(statusCode).json(body);
  }
}
