import { reconciliationInterval } from './reconciliation-policy.js';

const endpoint = process.env.BILLING_RECONCILIATION_URL ?? 'http://127.0.0.1:3001/internal/billing/reconcile/run';
const token = process.env.BILLING_INTERNAL_TOKEN?.trim();
const intervalMs = reconciliationInterval(process.env.BILLING_RECONCILIATION_INTERVAL_MS);
const limit = Number(process.env.BILLING_RECONCILIATION_BATCH_SIZE ?? 25);

let running = false;
let timer: NodeJS.Timeout | undefined;

async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    if (!token) throw new Error('BILLING_INTERNAL_TOKEN não configurado.');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ limit: Number.isInteger(limit) ? limit : 25 })
    });
    if (!response.ok) throw new Error('reconciliation HTTP ' + response.status);
    const summary = (await response.json()) as { processed?: number; delivered?: number; retried?: number };
    console.log(JSON.stringify({ level: 'info', service: 'quero-internet-worker', message: 'reconciliation_completed', ...summary }));
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      service: 'quero-internet-worker',
      message: 'reconciliation_failed',
      error: error instanceof Error ? error.message : 'unknown'
    }));
  } finally {
    running = false;
  }
}

async function main(): Promise<void> {
  console.log(JSON.stringify({ level: 'info', service: 'quero-internet-worker', message: 'worker_started', intervalMs }));
  await runOnce();
  timer = setInterval(() => { void runOnce(); }, intervalMs);

  const shutdown = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    console.log(JSON.stringify({ level: 'info', service: 'quero-internet-worker', message: 'worker_stopped' }));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

void main();
