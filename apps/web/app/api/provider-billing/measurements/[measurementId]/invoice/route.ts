import { proxyApi } from '../../../../../../lib/proxy-api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  const { measurementId } = await params;
  return proxyApi(`/provider-billing/measurements/${measurementId}/invoice`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  const { measurementId } = await params;
  return proxyApi(`/provider-billing/measurements/${measurementId}/invoice`, {
    method: 'POST',
    body: await request.text()
  });
}
