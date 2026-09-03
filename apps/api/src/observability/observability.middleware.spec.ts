import { observabilityMiddleware } from './observability.middleware';
import { ObservabilityService } from './observability.service';

describe('observabilityMiddleware', () => {
  it('propagates valid identifiers and records the response on finish', () => {
    const service = new ObservabilityService();
    const finishListeners: Array<() => void> = [];
    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn((_event: 'finish', listener: () => void) => {
        finishListeners.push(listener);
      })
    };

    const next = jest.fn();
    observabilityMiddleware(service)(
      {
        headers: {
          'x-request-id': 'request-123',
          'x-correlation-id': 'correlation-456'
        },
        method: 'GET',
        path: '/health'
      },
      response,
      next
    );

    expect(response.setHeader).toHaveBeenNthCalledWith(1, 'x-request-id', 'request-123');
    expect(response.setHeader).toHaveBeenNthCalledWith(2, 'x-correlation-id', 'correlation-456');
    expect(next).toHaveBeenCalledTimes(1);

    finishListeners[0]();
    expect(service.snapshot().counters.requests_total).toBe(1);
  });

  it('replaces invalid identifiers with generated safe values', () => {
    const service = new ObservabilityService();
    const response = {
      statusCode: 204,
      setHeader: jest.fn(),
      on: jest.fn()
    };

    observabilityMiddleware(service)(
      {
        headers: {
          'x-request-id': 'bad value',
          'x-correlation-id': 'also bad'
        },
        method: 'GET',
        path: '/health'
      },
      response,
      jest.fn()
    );

    const requestId = response.setHeader.mock.calls[0][1] as string;
    const correlationId = response.setHeader.mock.calls[1][1] as string;

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
