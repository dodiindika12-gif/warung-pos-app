import { NextResponse } from 'next/server';
import * as actions from '@/app/actions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { success: true, message: 'Warung POS Mobile API is online', timestamp: new Date().toISOString() },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400, headers: corsHeaders });
    }

    if (action === 'ping') {
      return NextResponse.json(
        { success: true, data: { pong: true, time: new Date().toISOString() } },
        { headers: corsHeaders }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionFunction = (actions as any)[action];

    if (typeof actionFunction !== 'function') {
      return NextResponse.json(
        { error: `Action ${action} not found` },
        { status: 404, headers: corsHeaders }
      );
    }

    let result;
    if (Array.isArray(payload)) {
      result = await actionFunction(...payload);
    } else if (payload !== undefined) {
      result = await actionFunction(payload);
    } else {
      result = await actionFunction();
    }

    return NextResponse.json({ success: true, data: result }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('API Mobile Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
