import { proxyApi } from '../../../../../../lib/proxy-api';

export async function POST(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return proxyApi(`/integrations/${encodeURIComponent(provider)}/connection/test`, { method: 'POST' });
}
