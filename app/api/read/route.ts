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

  try {
    if (table) {
      // Basic SQL injection prevention for table name (only letters, numbers, underscores)
      if (!/^[a-zA-Z0-9_]+$/.test(table)) {
        return NextResponse.json({ error: 'Invalid table name format' }, { status: 400 });
      }
      const result = await turso.execute(`SELECT * FROM ${table}`);
      return NextResponse.json({ data: result.rows });
    } else {
      // Fetch all tables if no specific table is requested
      const tablesResult = await turso.execute(`SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
      const tables = tablesResult.rows.map(row => row.name as string);
      
      const allData: Record<string, any[]> = {};
      for (const t of tables) {
        const res = await turso.execute(`SELECT * FROM ${t}`);
        allData[t] = res.rows;
      }
      
      return NextResponse.json({ data: allData });
    }
  } catch (error: any) {
    console.error('API Read Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
