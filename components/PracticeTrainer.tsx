'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Bot, FlipHorizontal, RotateCcw, Save, Skull, Sparkles } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useChessSound } from '@/hooks/useChessSound';
import { useGameContext } from '@/lib/GameContext';
import { useLichessEngine } from '@/hooks/useLichessEngine';
import { buildPracticePgn, downloadTextFile, getPracticeExportFilename, pickPracticeColor } from '@/lib/pgn-export';
import { Game, PlayerColor, PracticeSide } from '@/lib/types';

interface PracticeTrainerProps {
  game: Game;
  side: PracticeSide;
}

type TheoryMove = Game['moves'][number] & { color: PlayerColor };
interface PracticeMistake {
  fen: string;
  expectedMove: string;
  playedMove: string;
  moveNumber: number;
  sideToMove: PlayerColor;
}

function oppositeColor(color: PlayerColor): PlayerColor {
  return color === 'w' ? 'b' : 'w';
}

function sameMove(expected: Pick<TheoryMove, 'from' | 'to' | 'promotion'>, played: { from: string; to: string; promotion?: string }) {
  return expected.from === played.from
    && expected.to === played.to
    && (expected.promotion || undefined) === (played.promotion || undefined);
}

function parseUciMove(uci: string) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
  return { from, to, promotion };
}

const PhaseBadge = React.memo(function PhaseBadge({ label, tone }: { label: string; tone: 'opening' | 'engine' }) {
  const toneClass = tone === 'opening'
    ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200'
    : 'border-sky-800/40 bg-sky-950/20 text-sky-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
});

const MistakeRow = React.memo(function MistakeRow({ mistake, index }: { mistake: PracticeMistake; index: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">
          Move {mistake.moveNumber}
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({mistake.sideToMove === 'w' ? 'White' : 'Black'} to move)
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-gray-500">Mistake {index + 1}</span>
      </div>

      <div className="mt-2 grid gap-2 text-sm">
        <div className="rounded-lg bg-gray-900/80 px-3 py-2">
          <span className="text-gray-500">Expected:</span>{' '}
          <span className="text-emerald-300 font-medium">{mistake.expectedMove}</span>
        </div>
        <div className="rounded-lg bg-gray-900/80 px-3 py-2">
          <span className="text-gray-500">You played:</span>{' '}
          <span className="text-red-300 font-medium">{mistake.playedMove}</span>
        </div>
        <div className="rounded-lg bg-gray-900/80 px-3 py-2">
          <div className="text-gray-500 mb-1">Position FEN</div>
          <code className="block break-all text-[11px] leading-relaxed text-gray-300">{mistake.fen}</code>
        </div>
      </div>
    </div>
  );
});

function PracticeTrainerImpl({ game, side }: PracticeTrainerProps) {
  const { settings } = useGameContext();
  const { playMoveSound } = useChessSound(settings.soundEnabled);
  const { ready: lichessReady, error: lichessError, requestBestMove, cancelRequest } = useLichessEngine();

  const initialHumanColor = useMemo<PlayerColor>(() => pickPracticeColor(side), [side]);
  const initialTurn = useMemo<PlayerColor>(() => {
    const chess = new Chess(game.fen);
    return chess.turn() as PlayerColor;
  }, [game.fen]);

  const pgnMoves = useMemo<TheoryMove[]>(
    () => game.moves.map((move, index) => ({
      ...move,
      color: (index % 2 === 0 ? initialTurn : oppositeColor(initialTurn)) as PlayerColor,
    })),
    [game.moves, initialTurn]
  );

  const chessRef = useRef<Chess | null>(null);
  const engineMoveTimeoutRef = useRef<number | null>(null);
  if (!chessRef.current) {
    chessRef.current = new Chess(game.fen);
  }

  const humanColorRef = useRef<PlayerColor>(initialHumanColor);
  const engineEnabledRef = useRef(false);
  const deviatedFromPgnRef = useRef(false);
  const theoryIndexRef = useRef(0);
  const isThinkingRef = useRef(false);
  const gameOverRef = useRef(false);
  const boardFenRef = useRef(chessRef.current.fen());
  const statusRef = useRef('Loading practice game...');

  const [humanColor, setHumanColor] = useState<PlayerColor>(initialHumanColor);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(initialHumanColor === 'w' ? 'white' : 'black');
  const [boardFen, setBoardFen] = useState(boardFenRef.current);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [status, setStatus] = useState(statusRef.current);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<'1-0' | '0-1' | '1/2-1/2' | '*'>('*');
  const [savedPgn, setSavedPgn] = useState<string | null>(null);
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [deviatedFromPgn, setDeviatedFromPgn] = useState(false);
  const [mistakes, setMistakes] = useState<PracticeMistake[]>([]);

  const engineColor: PlayerColor = humanColor === 'w' ? 'b' : 'w';
  const openingPhase = !engineEnabled;

  const setStatusIfNeeded = useCallback((next: string) => {
    statusRef.current = next;
    setStatus((prev) => (prev === next ? prev : next));
  }, []);

  const setBoardFenIfNeeded = useCallback((nextFen: string) => {
    boardFenRef.current = nextFen;
    setBoardFen((prev) => (prev === nextFen ? prev : nextFen));
  }, []);

  const setEngineEnabledIfNeeded = useCallback((next: boolean) => {
    engineEnabledRef.current = next;
    setEngineEnabled((prev) => (prev === next ? prev : next));
  }, []);

  const setDeviatedIfNeeded = useCallback((next: boolean) => {
    deviatedFromPgnRef.current = next;
    setDeviatedFromPgn((prev) => (prev === next ? prev : next));
  }, []);

  const clearEngineMoveTimeout = useCallback(() => {
    if (engineMoveTimeoutRef.current !== null) {
      window.clearTimeout(engineMoveTimeoutRef.current);
      engineMoveTimeoutRef.current = null;
    }
  }, []);

  const finishIfGameOver = useCallback(() => {
    const chess = chessRef.current;
    if (!chess) return false;

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'b' : 'w';
      const finalResult = winner === 'w' ? '1-0' : '0-1';
      gameOverRef.current = true;
      setGameOver(true);
      setResult(finalResult);
      setStatusIfNeeded(finalResult === '1-0' ? 'White wins.' : 'Black wins.');
      return true;
    }

    if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
      gameOverRef.current = true;
      setGameOver(true);
      setResult('1/2-1/2');
      setStatusIfNeeded('Draw.');
      return true;
    }

    return false;
  }, [setStatusIfNeeded]);

  const resetPractice = useCallback((preserveCurrentColor = false) => {
    cancelRequest();
    clearEngineMoveTimeout();
    isThinkingRef.current = false;
    gameOverRef.current = false;
    engineEnabledRef.current = false;
    deviatedFromPgnRef.current = false;
    theoryIndexRef.current = 0;

    const nextHumanColor = preserveCurrentColor ? humanColorRef.current : pickPracticeColor(side);
    const chess = new Chess(game.fen);

    chessRef.current = chess;
    humanColorRef.current = nextHumanColor;
    boardFenRef.current = chess.fen();
    statusRef.current = 'Loading practice game...';

    setHumanColor(nextHumanColor);
    setBoardOrientation(nextHumanColor === 'w' ? 'white' : 'black');
    setBoardFen(chess.fen());
    setLastMove(null);
    setMoveHistory([]);
    setTheoryIndex(0);
    setStatus(nextHumanColor === 'w'
      ? 'Opening Practice. You are White.'
      : 'Opening Practice. You are Black.'
    );
    setGameOver(false);
    setResult('*');
    setSavedPgn(null);
    setEngineEnabled(false);
    setDeviatedFromPgn(false);
    setMistakes([]);
  }, [cancelRequest, clearEngineMoveTimeout, game.fen, side]);

  useEffect(() => {
    resetPractice();
  }, [game.id, resetPractice]);

  useEffect(() => {
    humanColorRef.current = humanColor;
  }, [humanColor]);

  useEffect(() => {
    if (gameOver) {
      gameOverRef.current = true;
    }
  }, [gameOver]);

  const advanceOpeningTheory = useCallback(() => {
    const chess = chessRef.current;
    if (!chess || gameOverRef.current || engineEnabledRef.current) return false;

    const nextMove = pgnMoves[theoryIndexRef.current];
    if (!nextMove || nextMove.color !== chess.turn() || nextMove.color === humanColorRef.current) {
      if (!nextMove || theoryIndexRef.current >= pgnMoves.length) {
        setEngineEnabledIfNeeded(true);
      }
      return false;
    }

    const applied = chess.move({
      from: nextMove.from,
      to: nextMove.to,
      promotion: nextMove.promotion,
    });

    if (!applied) {
      setEngineEnabledIfNeeded(true);
      return false;
    }

    theoryIndexRef.current += 1;
    setTheoryIndex(theoryIndexRef.current);
    setMoveHistory((prev) => [...prev, applied.san]);
    playMoveSound(
      applied.captured !== undefined,
      chess.inCheck(),
      Boolean(applied.flags?.includes('k') || applied.flags?.includes('q')),
      applied.promotion !== undefined
    );
    setBoardFenIfNeeded(chess.fen());
    setLastMove({ from: applied.from, to: applied.to });

    if (theoryIndexRef.current >= pgnMoves.length) {
      setEngineEnabledIfNeeded(true);
    }

    return !finishIfGameOver();
  }, [
    finishIfGameOver,
    pgnMoves,
    playMoveSound,
    setBoardFenIfNeeded,
    setEngineEnabledIfNeeded,
  ]);

  const requestEngineMove = useCallback(async () => {
    const chess = chessRef.current;
    if (!chess || gameOverRef.current || !engineEnabledRef.current || chess.turn() !== engineColor) {
      return;
    }

    if (!lichessReady) {
      setStatusIfNeeded(lichessError || 'Lichess API is loading...');
      return;
    }

    if (isThinkingRef.current) {
      return;
    }

    isThinkingRef.current = true;
    setStatusIfNeeded('Free Play vs Lichess. Lichess is thinking...');

    try {
      const bestMove = await requestBestMove({
        fen: chess.fen(),
        depth: 12,
      });

      if (!bestMove) {
        setStatusIfNeeded('Lichess had no move.');
        return;
      }

      const applied = chess.move(parseUciMove(bestMove));
      if (!applied) {
        setStatusIfNeeded('Lichess returned an illegal move.');
        return;
      }

      setMoveHistory((prev) => [...prev, applied.san]);
      playMoveSound(
        applied.captured !== undefined,
        chess.inCheck(),
        Boolean(applied.flags?.includes('k') || applied.flags?.includes('q')),
        applied.promotion !== undefined
      );
      setBoardFenIfNeeded(chess.fen());
      setLastMove({ from: applied.from, to: applied.to });

      if (finishIfGameOver()) {
        return;
      }

      setStatusIfNeeded(chess.turn() === humanColorRef.current
        ? 'Free Play vs Lichess. Your turn.'
        : 'Free Play vs Lichess. Lichess is thinking...');
    } catch (error) {
      setStatusIfNeeded(error instanceof Error ? error.message : 'Lichess failed to move.');
    } finally {
      isThinkingRef.current = false;
    }
  }, [
    engineColor,
    finishIfGameOver,
    playMoveSound,
    requestBestMove,
    setBoardFenIfNeeded,
    setStatusIfNeeded,
    lichessError,
    lichessReady,
  ]);

  const queueEngineMove = useCallback(() => {
    clearEngineMoveTimeout();
    engineMoveTimeoutRef.current = window.setTimeout(() => {
      engineMoveTimeoutRef.current = null;
      void requestEngineMove();
    }, 2000);
  }, [clearEngineMoveTimeout, requestEngineMove]);

  const handleHumanMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    if (gameOverRef.current) {
      return;
    }

    const chess = chessRef.current;
    if (!chess || chess.turn() !== humanColorRef.current) {
      return;
    }

    const fenBefore = chess.fen();
    const expectedMove = pgnMoves[theoryIndexRef.current];
    const openingLineActive = !engineEnabledRef.current && expectedMove?.color === humanColorRef.current;

    const applied = chess.move(move);
    if (!applied) {
      return;
    }

    setMoveHistory((prev) => [...prev, applied.san]);
    playMoveSound(
      applied.captured !== undefined,
      chess.inCheck(),
      Boolean(applied.flags?.includes('k') || applied.flags?.includes('q')),
      applied.promotion !== undefined
    );
    setBoardFenIfNeeded(chess.fen());
    setLastMove({ from: applied.from, to: applied.to });

    if (openingLineActive && expectedMove && !sameMove(expectedMove, move)) {
      const fullMoveNumber = Number(fenBefore.split(' ')[5] || '1');
      setMistakes((prev) => [
        ...prev,
        {
          fen: fenBefore,
          expectedMove: expectedMove.san,
          playedMove: applied.san,
          moveNumber: fullMoveNumber,
          sideToMove: humanColorRef.current,
        },
      ]);
      setDeviatedIfNeeded(true);
      setEngineEnabledIfNeeded(true);
      if (chess.turn() === engineColor) {
        queueEngineMove();
      }
    } else if (openingLineActive) {
      theoryIndexRef.current += 1;
      setTheoryIndex(theoryIndexRef.current);
      if (theoryIndexRef.current >= pgnMoves.length) {
        setEngineEnabledIfNeeded(true);
        if (chess.turn() === engineColor) {
          queueEngineMove();
        }
      }
    }

    if (finishIfGameOver()) {
      return;
    }
  }, [
    finishIfGameOver,
    pgnMoves,
    playMoveSound,
    queueEngineMove,
    setBoardFenIfNeeded,
    setDeviatedIfNeeded,
    setEngineEnabledIfNeeded,
  ]);

  useEffect(() => {
    if (gameOver) {
      return;
    }

    if (!engineEnabled) {
      clearEngineMoveTimeout();
      void advanceOpeningTheory();
      return;
    }

    if (chessRef.current?.turn() === engineColor) {
      setStatusIfNeeded('Free Play vs Lichess. Move in 2 seconds...');
      queueEngineMove();
      return;
    }

    clearEngineMoveTimeout();
    setStatusIfNeeded('Free Play vs Lichess. Your turn.');
  }, [
    advanceOpeningTheory,
    clearEngineMoveTimeout,
    boardFen,
    engineColor,
    engineEnabled,
    gameOver,
    requestEngineMove,
    queueEngineMove,
    setStatusIfNeeded,
    lichessReady,
    lichessError,
  ]);

  useEffect(() => {
    return () => {
      cancelRequest();
      clearEngineMoveTimeout();
    };
  }, [cancelRequest, clearEngineMoveTimeout]);

  const handleResign = useCallback(() => {
    cancelRequest();
    gameOverRef.current = true;
    setGameOver(true);
    setResult(engineColor === 'w' ? '1-0' : '0-1');
    setStatusIfNeeded('You resigned.');
  }, [cancelRequest, engineColor, setStatusIfNeeded]);

  const handleSavePgn = useCallback(() => {
    const pgn = buildPracticePgn({
      game,
      humanColor,
      moves: moveHistory,
      result,
    });

    setSavedPgn(pgn);
    downloadTextFile(
      getPracticeExportFilename({
        game,
        side,
        humanColor,
      }),
      pgn
    );
  }, [game, humanColor, moveHistory, result, side]);

  const phaseLabel = openingPhase ? 'Opening Practice' : 'Free Play vs Lichess';
  const phaseTone: 'opening' | 'engine' = openingPhase ? 'opening' : 'engine';
  const moveCountLabel = useMemo(() => `${theoryIndex}/${pgnMoves.length}`, [pgnMoves.length, theoryIndex]);

  const reviewHeader = mistakes.length === 0
    ? 'Perfect run'
    : `${mistakes.length} mistake${mistakes.length === 1 ? '' : 's'} recorded`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[800px] flex items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Bot className="h-4 w-4 text-emerald-400" />
                Lichess Practice
              </div>
              <p className="text-xs text-gray-400 truncate">
                {humanColor === 'w' ? 'You are White against Lichess.' : 'You are Black against Lichess.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <FlipHorizontal className="h-4 w-4 mr-2" />
                Flip
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResign}
                className="bg-gray-800 hover:bg-gray-700 text-white"
                disabled={gameOver}
              >
                <Skull className="h-4 w-4 mr-2" />
                Resign
              </Button>
            </div>
          </div>

          <ChessBoard
            fen={boardFen}
            onMove={handleHumanMove}
            disabled={gameOver}
            lastMove={lastMove || undefined}
            moveTransition={lastMove ? { from: lastMove.from, to: lastMove.to, direction: 'forward' } : null}
            orientation={boardOrientation}
            playerColor={humanColor}
            boardTheme={settings.boardTheme}
            pieceTheme={settings.pieceTheme}
          />

          <Card className="w-full max-w-[800px] p-4 bg-gray-900 border-gray-800">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhaseBadge label={phaseLabel} tone={phaseTone} />
                  <span className="text-xs text-gray-500">
                    {openingPhase ? 'PGN phase' : 'Engine phase'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Theory: {moveCountLabel}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Lichess: {lichessReady ? 'Ready' : 'Loading'}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Mistakes: {mistakes.length}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-4 bg-gray-900 border-gray-800">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Practice mode</p>
                <h3 className="text-lg font-semibold text-white mt-1">{phaseLabel}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {openingPhase
                  ? 'The selected PGN is guiding the opening. If you deviate, the game continues naturally against Lichess from the current position.'
                  : 'The opening line has ended or you deviated from it. From here on, you are playing free chess against Lichess.'}
              </p>
              <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-emerald-200">
                {humanColor === 'w'
                  ? 'You are training the White side.'
                  : 'You are training the Black side.'}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Game Controls</h3>
                {gameOver && (
                  <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300">
                    Game over
                  </span>
                )}
              </div>

              <Button
                onClick={() => resetPractice(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Practice
              </Button>

              {gameOver && (
                <Button
                  onClick={handleSavePgn}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save PGN Game
                </Button>
              )}

              {lichessError && (
                <p className="text-xs text-red-400">{lichessError}</p>
              )}

              <div className="text-xs text-gray-500">
                Final result: <span className="text-gray-200">{result}</span>
              </div>
            </div>
          </Card>

          {gameOver && (
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Review</p>
                  <h3 className="text-lg font-semibold text-white mt-1">{reviewHeader}</h3>
                </div>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300">
                  {result}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Deviated: {deviatedFromPgn ? 'Yes' : 'No'}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1">
                  Mistakes: {mistakes.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {mistakes.length === 0 ? (
                  <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-emerald-200">
                    No mistakes were logged in the opening line. Nice work.
                  </div>
                ) : (
                  mistakes.map((mistake, index) => (
                    <MistakeRow key={`${mistake.fen}-${index}`} mistake={mistake} index={index} />
                  ))
                )}
              </div>
            </Card>
          )}

          {savedPgn && (
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Last export</div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-950/70 p-3 text-xs text-gray-300">
                {savedPgn}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export const PracticeTrainer = React.memo(PracticeTrainerImpl);
