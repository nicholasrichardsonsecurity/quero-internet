import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { errorCodeForStatus, safeErrorMessage } from './api-contract';
import { ApiExceptionFilter } from './api-exception.filter';

function createHost(url = '/test', requestId?: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  return {
    json,
    status,
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          url,
          headers: requestId ? { 'x-request-id': requestId } : {}
        })
      })
    }
  };
}

describe('api contract', () => {
  it('maps stable error codes by status', () => {
    expect(errorCodeForStatus(400)).toBe('BAD_REQUEST');
    expect(errorCodeForStatus(401)).toBe('UNAUTHORIZED');
    expect(errorCodeForStatus(403)).toBe('FORBIDDEN');
    expect(errorCodeForStatus(404)).toBe('RESOURCE_NOT_FOUND');
    expect(errorCodeForStatus(409)).toBe('CONFLICT');
    expect(errorCodeForStatus(429)).toBe('RATE_LIMITED');
    expect(errorCodeForStatus(500)).toBe('INTERNAL_ERROR');
  });

  it('does not leak internal messages on 5xx errors', () => {
    expect(safeErrorMessage(500, 'database password failed')).toBe('Erro interno ao processar a requisição.');
  });

  it('preserves safe domain messages on 4xx errors', () => {
    expect(safeErrorMessage(400, 'Status de serviço inválido.')).toBe('Status de serviço inválido.');
  });

  it('returns an error envelope with request id when provided', () => {
    const filter = new ApiExceptionFilter();
    const { host, status, json } = createHost('/provider-referrals/abc/service', 'req-123');

    filter.catch(new BadRequestException('Status de serviço inválido.'), host as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Status de serviço inválido.',
          statusCode: 400,
          path: '/provider-referrals/abc/service',
          requestId: 'req-123'
        })
      })
    );
  });

  it('normalizes 5xx exceptions in the envelope', () => {
    const filter = new ApiExceptionFilter();
    const { host, status, json } = createHost('/health');

    filter.catch(new InternalServerErrorException('internal stack detail'), host as any);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao processar a requisição.',
          statusCode: 500,
          path: '/health'
        })
      })
    );
  });
});
