import { Injectable } from '@nestjs/common';

type MetricKey = 'requests_total' | 'requests_failed' | 'request_duration_ms_total';

@Injectable()
export class ObservabilityService {
  private readonly startedAt = Date.now();
  private readonly counters: Record<MetricKey, number> = {
    requests_total: 0,
    requests_failed: 0,
    request_duration_ms_total: 0
  };
  private readonly statusCounts = new Map<string, number>();

  observe(statusCode: number, durationMs: number) {
    this.counters.requests_total += 1;
    this.counters.request_duration_ms_total += durationMs;
    if (statusCode >= 500) this.counters.requests_failed += 1;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    this.statusCounts.set(statusClass, (this.statusCounts.get(statusClass) ?? 0) + 1);
  }

  snapshot() {
    const requests = this.counters.requests_total;
    return {
      service: 'quero-internet-api',
      process: { uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000) },
      counters: { ...this.counters },
      statusClasses: Object.fromEntries(this.statusCounts),
      averageRequestDurationMs: requests ? Math.round((this.counters.request_duration_ms_total / requests) * 100) / 100 : 0,
      collectedAt: new Date().toISOString()
    };
  }
}
