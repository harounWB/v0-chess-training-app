export interface Move {
  notation: string; // e.g., "e4"
  san: string; // Standard algebraic notation, e.g., "e4" or "Nf3"
  from: string; // e.g., "e2"
  to: string; // e.g., "e4"
  promotion?: string;
  comment?: string;
  variations?: Variation[];
  fenBefore?: string; // Board state before the move is played
  fenAfter?: string; // Board state after the move is played
}

export interface Variation {
  moves: Move[];
  comment?: string;
}

export interface GameNode {
  move: Move;
  variations: GameNode[];
  next?: GameNode;
}

export interface MoveAttempt {
  moveIndex: number;
  wrongAttempts: number; // Count of wrong tries before success
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameSession {
  gameId: string;
  difficulty: DifficultyLevel;
  moveAttempts: MoveAttempt[];
  startTime: number;
  completedAt?: number;
  totalMoves: number;
  correctMoves: number;
  incorrectMoves: number;
  hintsUsed: number;
}

export interface Game {
  id: string;
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  moves: Move[];
  variations: Variation[];
  completed?: boolean;
  pgn?: string;
  opening?: string;
  openingCode?: string;
  collectionId?: string | null;
  fen?: string; // Starting position FEN if not standard starting position
}

export interface PGNFile {
  games: Game[];
}

export interface PGNProgress {
  fileName: string;
  games: Game[];
  exploredGames: Set<string>; // Game IDs that have been explored
  trainedGames: Set<string>; // Game IDs that have been trained (completed)
  isDone: boolean; // True if all games are both explored and trained
  importedAt: number; // Timestamp when this PGN was imported
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type BoardTheme = 'classic' | 'wood' | 'stone' | 'purple' | 'lichess';
export type PieceTheme = 'neo' | 'alpha' | 'merida' | 'lichess';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface AppSettings {
  themeMode: ThemeMode;
  soundEnabled: boolean;
  animationSpeed: AnimationSpeed;
  boardTheme: BoardTheme;
  pieceTheme: PieceTheme;
}

export interface Collection {
  id: string;
  name: string;
  fileNames: string[];
  createdAt: number;
}

export type PlayerColor = 'w' | 'b';
export type TrainingMode = 'train' | 'explore';
export type PracticeSide = 'white' | 'black' | 'random';

export interface PracticeSetup {
  fileNames: string[];
  side: PracticeSide;
  createdAt: number;
}

export interface TrainerState {
  currentGame: Game | null;
  moveIndex: number;
  trainingMode: TrainingMode;
  playerColor: PlayerColor;
  selectedVariationIndex: number;
  gameState: any; // Will be chess.Game instance
  message: string;
  isCorrect: boolean | null;
}
