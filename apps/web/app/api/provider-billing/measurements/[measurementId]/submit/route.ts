import { proxyApi } from '../../../../../../../../lib/proxy-api';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  const { measurementId } = await params;
  return proxyApi(`/provider-billing/measurements/${measurementId}/submit`, { method: 'POST' });
}
