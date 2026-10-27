import { proxyApi } from '../../../../../lib/proxy-api';

type Params = { params: Promise<{ provider: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { provider } = await params;
  return proxyApi(`/integrations/${encodeURIComponent(provider)}/connection`, { method: 'PUT', body: await request.text() });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { provider } = await params;
  return proxyApi(`/integrations/${encodeURIComponent(provider)}/connection`, { method: 'DELETE' });
}
