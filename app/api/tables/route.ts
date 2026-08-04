import { NextResponse } from 'next/server';
import { turso } from '@/app/db';

export async function GET(request: Request) {
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  const { searchParams } = new URL(request.url);
  if (authHeader !== 'Bearer 2021' && searchParams.get('pin') !== '2021') {
    return NextResponse.json({ error: 'Unauthorized. Please provide valid pin or Bearer token.' }, { status: 401 });
  }

  try {
    const result = await turso.execute(`SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    const tables = result.rows.map(row => row.name);
    return NextResponse.json({ data: tables });
  } catch (error: any) {
    console.error('API Tables Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
