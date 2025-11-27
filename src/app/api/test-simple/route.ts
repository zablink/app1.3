// Simple test API without any dependencies
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('test-simple API called');
  
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
