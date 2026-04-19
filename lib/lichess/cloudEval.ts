export type LichessCloudEvalResponse = {
  fen?: string;
  depth?: number;
  knodes?: number;
  pvs?: Array<{
    moves?: string;
    cp?: number;
    mate?: number;
  }>;
};

function createLichessError(message: string) {
  return new Error(`Lichess cloud eval error: ${message}`);
}

export async function getLichessBestMove({
  fen,
  timeoutMs = 15000,
}: {
  fen: string;
  timeoutMs?: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL('https://lichess.org/api/cloud-eval');
    url.searchParams.set('fen', fen);
    url.searchParams.set('multiPv', '1');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 429) {
      throw createLichessError('rate limited. Please wait a minute and try again.');
    }

    if (!response.ok) {
      throw createLichessError(`request failed with status ${response.status}.`);
    }

    const data = await response.json() as LichessCloudEvalResponse;
    const principalVariation = data.pvs?.[0];
    const bestMove = principalVariation?.moves?.trim().split(/\s+/)[0] ?? null;

    return bestMove && bestMove !== '(none)' ? bestMove : null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createLichessError('request timed out.');
    }

    throw error instanceof Error ? error : createLichessError('unknown failure.');
  } finally {
    clearTimeout(timeout);
  }
}
