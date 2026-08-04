import { NextResponse } from 'next/server';
import { turso } from '@/app/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== 'Bearer 2021' && searchParams.get('pin') !== '2021') {
    return NextResponse.json({ error: 'Unauthorized. Please provide valid pin or Bearer token.' }, { status: 401 });
  }

  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
  }

  // Basic SQL injection prevention for table name (only letters, numbers, underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name format' }, { status: 400 });
  }

  try {
    const result = await turso.execute(`SELECT * FROM ${table}`);
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    console.error('API Read Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
