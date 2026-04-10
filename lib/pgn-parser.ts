import { Game, Move, Variation } from './types';
import { Chess } from 'chess.js';

/**
 * Parse PGN file content and extract games with moves and variations
 * Supports multiple games, comments, and variations in a single file
 */
export function parsePGN(pgnContent: string): Game[] {
  const games: Game[] = [];
  
  // Split by game headers (lines starting with [)
  const gameBlocks = pgnContent.split(/\n(?=\[Event|\[White|\[Black|\[Site)/);
  
  for (const block of gameBlocks) {
    if (!block.trim()) continue;
    
    const game = parseGameBlock(block);
    if (game && game.moves.length > 0) {
      game.id = `game-${games.length + 1}`;
      games.push(game);
    }
  }
  
  return games;
}

function parseGameBlock(blockContent: string): Game | null {
  const lines = blockContent.split('\n');
  
  const headers: Record<string, string> = {};
  let movesSectionStartIndex = 0;
  
  // Parse headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('[')) {
      const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
      if (match) {
        headers[match[1]] = match[2];
      }
    } else if (line && !line.startsWith('[')) {
      movesSectionStartIndex = i;
      break;
    }
  }
  
  // Extract moves section
  const movesContent = lines.slice(movesSectionStartIndex).join(' ');
  if (!movesContent.trim()) return null;
  
  // Parse moves with the chess.js library for validation
  const { moves, variations } = parseMovesWithVariations(movesContent);
  
  if (moves.length === 0) return null;
  
  return {
    id: '',
    white: headers['White'] || 'White',
    black: headers['Black'] || 'Black',
    event: headers['Event'],
    date: headers['Date'],
    result: headers['Result'],
    moves,
    variations,
    completed: false,
  };
}

function parseMovesWithVariations(movesContent: string): { moves: Move[]; variations: Variation[] } {
  const moves: Move[] = [];
  const variations: Variation[] = [];
  
  // Initialize a fresh chess instance for this game
  const chess = new Chess();
  
  // Clean up the moves content - remove line breaks and extra spaces
  let content = movesContent
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove result at the end
  content = content.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
  
  // Remove NAGs like $1, $2, etc.
  content = content.replace(/\$\d+/g, '');
  
  // Remove variations (text in parentheses) - handle nested parentheses
  let prevContent = '';
  while (prevContent !== content) {
    prevContent = content;
    content = content.replace(/\([^()]*\)/g, '');
  }
  
  // Tokenize while preserving comments
  // This regex captures: move numbers, moves, and comments in braces
  const tokenRegex = /(\d+\.+)|(\{[^}]*\})|([KQRBNP]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)|([O0]-[O0](?:-[O0])?[+#]?)/g;
  
  const tokens: { type: 'number' | 'comment' | 'move'; value: string }[] = [];
  let match;
  
  while ((match = tokenRegex.exec(content)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'number', value: match[1] });
    } else if (match[2]) {
      // Extract comment content without braces
      tokens.push({ type: 'comment', value: match[2].slice(1, -1).trim() });
    } else if (match[3]) {
      tokens.push({ type: 'move', value: match[3] });
    } else if (match[4]) {
      // Castling - normalize O to standard
      tokens.push({ type: 'move', value: match[4].replace(/0/g, 'O') });
    }
  }
  
  // Process tokens - attach comments to the preceding move
  let pendingComment: string | undefined;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'number') {
      continue; // Skip move numbers
    }
    
    if (token.type === 'comment') {
      // Look ahead - if next token is a move, this comment is for that move (pre-comment)
      // Otherwise attach to previous move
      if (moves.length > 0) {
        // Attach to the last move
        const lastMove = moves[moves.length - 1];
        if (lastMove.comment) {
          lastMove.comment += ' ' + token.value;
        } else {
          lastMove.comment = token.value;
        }
      } else {
        // Store as pending for the first move
        pendingComment = token.value;
      }
      continue;
    }
    
    if (token.type === 'move') {
      const moveStr = token.value;
      
      try {
        const move = chess.move(moveStr, { sloppy: true });
        if (move) {
          const moveObj: Move = {
            notation: moveStr,
            san: move.san || moveStr,
            from: move.from,
            to: move.to,
            promotion: move.promotion,
            comment: pendingComment,
            variations: [],
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

function extractVariationContent(content: string): string | null {
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (content[i] === ')') {
      depth--;
      if (depth === 0 && start !== -1) {
        return content.substring(start, i);
      }
    }
  }
  
  return null;
}

function parseMovesFromString(moveString: string, chess: Chess): Move[] {
  const moves: Move[] = [];
  const chess_copy = new Chess(chess.fen());
  
  const moveMatches = moveString.match(/[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][+#=]?[qrbn]?|O-O(?:-O)?/g) || [];
  
  for (const moveStr of moveMatches) {
    try {
      const move = chess_copy.move(moveStr, { sloppy: true });
      if (move) {
        moves.push({
          notation: moveStr,
          san: move.san || moveStr,
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
      }
    } catch (e) {
      // Skip invalid moves
    }
  }
  
  return moves;
}

/**
 * Validate that all moves in a game are legal
 */
export function validateGameMoves(game: Game): boolean {
  const chess = new Chess();
  
  for (const move of game.moves) {
    try {
      const result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      }, { sloppy: false });
      
      if (!result) {
        console.error(`Invalid move: ${move.san} at position ${chess.fen()}`);
        return false;
      }
    } catch (e) {
      console.error(`Move validation error: ${move.san}`, e);
      return false;
    }
  }
  
  return true;
}
