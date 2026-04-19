import { NextResponse } from 'next/server';
import { getLichessBestMove } from '@/lib/lichess/cloudEval';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { fen?: string } | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const fen = typeof body?.fen === 'string' ? body.fen.trim() : '';

  if (!fen) {
    return NextResponse.json(
      { error: 'Missing FEN.' },
      { status: 400 }
    );
  }

  try {
    const bestMove = await getLichessBestMove({ fen });
    return NextResponse.json({ bestMove });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lichess analysis failed.';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
