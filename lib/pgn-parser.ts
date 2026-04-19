import { Game, Move, Variation } from './types';
import { Chess } from 'chess.js';

/**
 * Parse PGN file content and extract games with moves and variations
 * Supports multiple games, comments, and variations in a single file
 */
export function parsePGN(pgnContent: string): Game[] {
  const games: Game[] = [];
  
  // Split by game headers - look for [Event or start of file with headers
  const gameBlocks = splitIntoGameBlocks(pgnContent);
  
  for (const block of gameBlocks) {
    if (!block.trim()) continue;
    
    try {
      const game = parseGameBlock(block);
      if (game && game.moves.length > 0) {
        game.id = `game-${games.length + 1}`;
        games.push(game);
      }
    } catch (e) {
      console.warn('[v0] Failed to parse game block:', e);
    }
  }
  
  return games;
}

export function normalizeFen(fen?: string | null): string {
  if (!fen) return '';
  return fen.trim().split(/\s+/).slice(0, 4).join(' ');
}

export function createChessFromFen(fen?: string): Chess {
  if (!fen) return new Chess();

  try {
    return new Chess(fen);
  } catch {
    return new Chess();
  }
}

export function replayGameToMoveIndex(game: Pick<Game, 'fen' | 'moves'>, moveCount: number): Chess {
  const chess = createChessFromFen(game.fen);

  for (let i = 0; i < moveCount; i++) {
    const move = game.moves[i];
    if (!move) break;

    try {
      chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
    } catch {
      // Skip invalid moves silently so partially malformed PGNs still load.
    }
  }

  return chess;
}

export function findContinuationMoveIndex(game: Pick<Game, 'fen' | 'moves'>, fen: string): number {
  const targetFen = normalizeFen(fen);
  if (!targetFen) return 0;

  const startingFen = normalizeFen(game.fen);
  if (startingFen && startingFen === targetFen) {
    return 0;
  }

  for (let i = 0; i < game.moves.length; i++) {
    const move = game.moves[i];

    if (move.fenBefore && normalizeFen(move.fenBefore) === targetFen) {
      return i;
    }

    if (move.fenAfter && normalizeFen(move.fenAfter) === targetFen) {
      return i + 1;
    }
  }

  return 0;
}

function splitIntoGameBlocks(content: string): string[] {
  const blocks: string[] = [];
  const lines = content.split('\n');
  let currentBlock: string[] = [];
  let inMoves = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // New game starts with [Event or any header after moves
    if (trimmed.startsWith('[') && inMoves) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      inMoves = false;
    }
    
    currentBlock.push(line);
    
    // We're in moves section if line doesn't start with [ and isn't empty
    if (trimmed && !trimmed.startsWith('[')) {
      inMoves = true;
    }
  }
  
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }
  
  return blocks;
}

function parseGameBlock(blockContent: string): Game | null {
  const lines = blockContent.split('\n');
  
  const headers: Record<string, string> = {};
  const moveLines: string[] = [];
  
  // Parse headers and collect move lines
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('[')) {
      const match = trimmed.match(/\[(\w+)\s+"([^"]*)"\]/);
      if (match) {
        headers[match[1]] = match[2];
      }
    } else if (trimmed) {
      moveLines.push(trimmed);
    }
  }
  
  const movesContent = moveLines.join(' ');
  if (!movesContent.trim()) return null;
  
  // Parse moves with chess.js validation
  const { moves, variations } = parseMovesWithVariations(movesContent, headers['FEN']);
  
  if (moves.length === 0) return null;
  
  return {
    id: '',
    white: headers['White'] || 'White',
    black: headers['Black'] || 'Black',
    event: headers['Event'],
    date: headers['Date'],
    result: headers['Result'],
    opening: headers['Opening'] || headers['Event'] || `${headers['White'] || 'White'} vs ${headers['Black'] || 'Black'}`,
    openingCode: headers['ECO'],
    pgn: blockContent.trim(),
    moves,
    variations,
    completed: false,
    fen: headers['FEN'], // Include FEN if present
  };
}

interface Token {
  type: 'number' | 'comment' | 'move' | 'variation_start' | 'variation_end' | 'result' | 'nag';
  value: string;
}

function tokenize(content: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < content.length) {
    // Skip whitespace
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;
    
    const char = content[i];
    
    // Comment in braces
    if (char === '{') {
      const end = content.indexOf('}', i);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: content.slice(i + 1, end).trim() });
        i = end + 1;
        continue;
      }
    }
    
    // Variation start
    if (char === '(') {
      tokens.push({ type: 'variation_start', value: '(' });
      i++;
      continue;
    }
    
    // Variation end
    if (char === ')') {
      tokens.push({ type: 'variation_end', value: ')' });
      i++;
      continue;
    }
    
    // NAG (Numeric Annotation Glyph)
    if (char === '$') {
      let nag = '$';
      i++;
      while (i < content.length && /\d/.test(content[i])) {
        nag += content[i];
        i++;
      }
      tokens.push({ type: 'nag', value: nag });
      continue;
    }
    
    // Move number (e.g., 1. or 1...)
    if (/\d/.test(char)) {
      let num = '';
      while (i < content.length && /\d/.test(content[i])) {
        num += content[i];
        i++;
      }
      // Skip dots after number
      while (i < content.length && content[i] === '.') i++;
      // Skip whitespace after dots
      while (i < content.length && /\s/.test(content[i])) i++;
      
      // Check if this is a result (1-0, 0-1, 1/2-1/2)
      if (num === '1' && content.slice(i, i + 2) === '-0') {
        tokens.push({ type: 'result', value: '1-0' });
        i += 2;
        continue;
      }
      if (num === '0' && content.slice(i, i + 2) === '-1') {
        tokens.push({ type: 'result', value: '0-1' });
        i += 2;
        continue;
      }
      if (num === '1' && content.slice(i, i + 6) === '/2-1/2') {
        tokens.push({ type: 'result', value: '1/2-1/2' });
        i += 6;
        continue;
      }
      
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Result asterisk
    if (char === '*') {
      tokens.push({ type: 'result', value: '*' });
      i++;
      continue;
    }
    
    // Move (SAN notation)
    // Castling
    if (content.slice(i, i + 5) === 'O-O-O' || content.slice(i, i + 5) === '0-0-0') {
      let move = content.slice(i, i + 5);
      i += 5;
      // Check for check/mate symbols
      while (i < content.length && /[+#!?]/.test(content[i])) {
        move += content[i];
        i++;
      }
      tokens.push({ type: 'move', value: move.replace(/0/g, 'O') });
      continue;
    }
    if (content.slice(i, i + 3) === 'O-O' || content.slice(i, i + 3) === '0-0') {
      let move = content.slice(i, i + 3);
      i += 3;
      while (i < content.length && /[+#!?]/.test(content[i])) {
        move += content[i];
        i++;
      }
      tokens.push({ type: 'move', value: move.replace(/0/g, 'O') });
      continue;
    }
    
    // Regular move
    if (/[KQRBNP a-h]/.test(char)) {
      let move = '';
      // Piece moves or pawn moves
      while (i < content.length && /[KQRBNPa-h1-8x=+#!?]/.test(content[i])) {
        move += content[i];
        i++;
      }
      if (move.length > 0) {
        // Clean up annotation marks for the move token
        const cleanMove = move.replace(/[!?]/g, '');
        if (cleanMove.length > 0) {
          tokens.push({ type: 'move', value: cleanMove });
        }
        continue;
      }
    }
    
    // Skip unknown character
    i++;
  }
  
  return tokens;
}

function parseMovesWithVariations(movesContent: string, fen?: string): { moves: Move[]; variations: Variation[] } {
  const tokens = tokenize(movesContent);
  const chess = createChessFromFen(fen);
  const moves: Move[] = [];
  const variations: Variation[] = [];
  
  let pendingComment: string | undefined;
  let variationDepth = 0;
  let variationTokens: Token[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Handle variations - skip them for main line but track depth
    if (token.type === 'variation_start') {
      variationDepth++;
      continue;
    }
    if (token.type === 'variation_end') {
      variationDepth--;
      continue;
    }
    
    // Skip tokens inside variations
    if (variationDepth > 0) continue;
    
    // Skip move numbers, results, NAGs
    if (token.type === 'number' || token.type === 'result' || token.type === 'nag') {
      continue;
    }
    
    // Handle comments
    if (token.type === 'comment') {
      if (moves.length > 0) {
        // Attach to last move
        const lastMove = moves[moves.length - 1];
        if (lastMove.comment) {
          lastMove.comment += ' ' + token.value;
        } else {
          lastMove.comment = token.value;
        }
      } else {
        // Store for first move
        pendingComment = pendingComment ? pendingComment + ' ' + token.value : token.value;
      }
      continue;
    }
    
    // Handle moves
    if (token.type === 'move') {
      try {
        const fenBefore = chess.fen();
        const result = chess.move(token.value as any, { sloppy: true } as any);
        if (result) {
          const moveObj: Move = {
            notation: token.value,
            san: result.san,
            from: result.from,
            to: result.to,
            promotion: result.promotion,
            comment: pendingComment,
            variations: [],
            fenBefore,
            fenAfter: chess.fen(),
          };
          moves.push(moveObj);
          pendingComment = undefined;
        }
      } catch (e) {
        // Skip invalid moves silently
      }
    }
  }
  
  return { moves, variations };
}

/**
 * Validate that all moves in a game are legal
 */
export function validateGameMoves(game: Game): boolean {
  const chess = createChessFromFen(game.fen);
  
  for (const move of game.moves) {
    try {
      const result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      
      if (!result) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  
  return true;
}
