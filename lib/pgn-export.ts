import { Game, PracticeSide } from '@/lib/types';

function escapePgnText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function sanitizeFilenamePart(value: string) {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'repertoire';
}

export function pickPracticeColor(side: PracticeSide): 'w' | 'b' {
  if (side === 'white') return 'w';
  if (side === 'black') return 'b';
  return Math.random() < 0.5 ? 'w' : 'b';
}

export function getPracticeExportFilename(options: {
  game: Game;
  side: PracticeSide;
  humanColor: 'w' | 'b';
}) {
  const repertoireName = sanitizeFilenamePart(options.game.id.split('::')[0] || options.game.white || 'repertoire');
  const resolvedSide = options.humanColor === 'w' ? 'white' : 'black';
  const chosenSide = options.side === 'random' ? `random-${resolvedSide}` : options.side;

  return `practice-${repertoireName}-${chosenSide}.pgn`;
}

export function buildPracticePgn(options: {
  game: Game;
  humanColor: 'w' | 'b';
  moves: string[];
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  date?: string;
  site?: string;
}) {
  const { game, humanColor, moves, result, date = new Date().toISOString().slice(0, 10), site = 'Openingmaster Practice' } = options;
  const whiteLabel = humanColor === 'w' ? 'User' : 'Lichess';
  const blackLabel = humanColor === 'b' ? 'User' : 'Lichess';

  const headers = [
    ['Event', 'Practice game against repertoire'],
    ['Site', site],
    ['Date', date],
    ['Round', '-'],
    ['White', whiteLabel],
    ['Black', blackLabel],
    ['Result', result],
  ];

  if (game.fen) {
    headers.push(['SetUp', '1']);
    headers.push(['FEN', game.fen]);
  }

  const moveText = moves.reduce((acc, san, index) => {
    if (index % 2 === 0) {
      return `${acc}${Math.floor(index / 2) + 1}. ${san}`;
    }

    return `${acc} ${san}`;
  }, '').trim();

  const headerText = headers
    .map(([key, value]) => `[${key} "${escapePgnText(value)}"]`)
    .join('\n');

  return `${headerText}\n\n${moveText} ${result}`.trim() + '\n';
}

export function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
