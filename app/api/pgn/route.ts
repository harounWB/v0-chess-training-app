import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

const PGN_DIR = path.join(process.cwd(), 'app', 'upload', 'PGN');

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  if (fileName.includes('/') || fileName.includes('\\')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const filePath = path.join(PGN_DIR, fileName);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(path.resolve(PGN_DIR) + path.sep)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    const content = await fs.readFile(resolvedPath, 'utf8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: `Failed to load PGN file: ${fileName}` },
      { status: 404 }
    );
  }
}
