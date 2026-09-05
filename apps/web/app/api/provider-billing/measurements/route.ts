import { proxyApi } from '../../../../../lib/proxy-api';

export async function GET() {
  return proxyApi('/provider-billing/measurements');
}
