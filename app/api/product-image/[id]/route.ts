import { NextRequest, NextResponse } from 'next/server';
import { turso } from '../../../db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const { rows } = await turso.execute({
      sql: 'SELECT image FROM products WHERE id = ? AND image IS NOT NULL AND image != ""',
      args: [id]
    });

    if (rows.length === 0 || !rows[0].image) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const imageStr = rows[0].image as string;
    
    // Check if it's a base64 data URI
    const match = imageStr.match(/^data:(.+);base64,(.*)$/);
    if (match) {
      const mime = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // If it's a URL, we could redirect or just return it as text
    if (imageStr.startsWith('http')) {
      return NextResponse.redirect(imageStr);
    }

    // Fallback if not recognized
    return new NextResponse('Invalid image format', { status: 500 });

  } catch (error) {
    console.error('Error fetching image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
