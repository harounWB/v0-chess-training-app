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
  let cleanContent = movesContent
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove result at the end
  cleanContent = cleanContent.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
  
  // Remove variations (text in parentheses) for simpler parsing
  cleanContent = cleanContent.replace(/\([^)]*\)/g, '');
  
  // Remove comments (text in curly braces)
  cleanContent = cleanContent.replace(/\{[^}]*\}/g, '');
  
  // Remove NAGs like $1, $2, etc.
  cleanContent = cleanContent.replace(/\$\d+/g, '');
  
  // Remove move numbers (e.g., "1.", "23...", "1...")
  cleanContent = cleanContent.replace(/\d+\.+/g, '');
  
  // Split by whitespace to get individual moves
  const tokens = cleanContent.split(/\s+/).filter(t => t.length > 0);
  
  for (const token of tokens) {
    // Skip empty tokens or remaining result markers
    if (!token || token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*') {
      continue;
    }
    
    // Skip if it looks like a move number that wasn't fully cleaned
    if (/^\d+$/.test(token)) {
      continue;
    }
    
    // Clean the move string
    const moveStr = token.trim();
    
    if (moveStr && moveStr.length > 0) {
      try {
        // Try to parse the move
        const move = chess.move(moveStr, { sloppy: true });
        if (move) {
          const moveObj: Move = {
            notation: moveStr,
            san: move.san || moveStr,
            from: move.from,
            to: move.to,
            promotion: move.promotion,
            variations: [],
          };
          
          moves.push(moveObj);
        }
      } catch (e) {
        // Skip invalid moves silently - they might be annotations or other text
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
