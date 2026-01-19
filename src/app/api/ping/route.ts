// Ultra simple ping API - absolutely no imports
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('pong', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
