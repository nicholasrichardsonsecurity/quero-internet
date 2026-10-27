import { proxyApi } from '../../../../lib/proxy-api';

export async function GET() {
  return proxyApi('/integrations/connections');
}
