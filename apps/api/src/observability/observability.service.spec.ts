import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  it('aggregates request counters and status classes', () => {
    const service = new ObservabilityService();

    service.observe(200, 12.4);
    service.observe(201, 8.2);
    service.observe(500, 20.1);

    expect(service.snapshot()).toMatchObject({
      service: 'quero-internet-api',
      counters: {
        requests_total: 3,
        requests_failed: 1,
        request_duration_ms_total: 40.7
      },
      statusClasses: {
        '2xx': 2,
        '5xx': 1
      },
      averageRequestDurationMs: 13.57
    });
  });

  it('returns a zero average when no request was observed', () => {
    expect(new ObservabilityService().snapshot()).toMatchObject({
      counters: {
        requests_total: 0,
        requests_failed: 0,
        request_duration_ms_total: 0
      },
      averageRequestDurationMs: 0,
      statusClasses: {}
    });
  });
});
