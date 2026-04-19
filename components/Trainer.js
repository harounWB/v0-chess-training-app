'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trainer = Trainer;
var react_1 = require("react");
var chess_js_1 = require("chess.js");
var ChessBoard_1 = require("./ChessBoard");
var TrainingPanel_1 = require("./TrainingPanel");
var MovesPanel_1 = require("./MovesPanel");
var GameList_1 = require("./GameList");
var SessionFeedback_1 = require("./SessionFeedback");
var PlaybackControls_1 = require("./PlaybackControls");
var button_1 = require("./ui/button");
var lucide_react_1 = require("lucide-react");
var useChessSound_1 = require("@/hooks/useChessSound");
var GameContext_1 = require("@/lib/GameContext");
function Trainer(_a) {
    var _b;
    var games = _a.games;
    var playMoveSound = (0, useChessSound_1.useChessSound)().playMoveSound;
    var _c = (0, GameContext_1.useGameContext)(), selectedGame = _c.selectedGame, setSelectedGame = _c.setSelectedGame, moveIndex = _c.moveIndex, setMoveIndex = _c.setMoveIndex, saveCompletedGame = _c.saveCompletedGame, markGameExplored = _c.markGameExplored;
    var lastExploredGameRef = (0, react_1.useRef)(null);
    var currentGameIndex = (_b = games.findIndex(function (g) { return g.id === (selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.id); })) !== null && _b !== void 0 ? _b : -1;
    var _d = (0, react_1.useState)('train'), trainingMode = _d[0], setTrainingMode = _d[1];
    var _e = (0, react_1.useState)('w'), playerColor = _e[0], setPlayerColor = _e[1];
    var _f = (0, react_1.useState)(null), gameState = _f[0], setGameState = _f[1];
    var _g = (0, react_1.useState)(''), message = _g[0], setMessage = _g[1];
    var _h = (0, react_1.useState)(null), isCorrect = _h[0], setIsCorrect = _h[1];
    var _j = (0, react_1.useState)(new Set()), completedGames = _j[0], setCompletedGames = _j[1];
    var _k = (0, react_1.useState)(0), hintLevel = _k[0], setHintLevel = _k[1];
    var _l = (0, react_1.useState)(0), hintUsedCount = _l[0], setHintUsedCount = _l[1]; // Track hint usage
    var _m = (0, react_1.useState)(false), showMoveComment = _m[0], setShowMoveComment = _m[1];
    var _o = (0, react_1.useState)(null), wrongMoveSquares = _o[0], setWrongMoveSquares = _o[1];
    var _p = (0, react_1.useState)(null), correctMoveSquares = _p[0], setCorrectMoveSquares = _p[1];
    var _q = (0, react_1.useState)('medium'), difficulty = _q[0], setDifficulty = _q[1];
    var _r = (0, react_1.useState)([]), moveAttempts = _r[0], setMoveAttempts = _r[1];
    var _s = (0, react_1.useState)(false), sessionComplete = _s[0], setSessionComplete = _s[1];
    var _t = (0, react_1.useState)(null), currentSession = _t[0], setCurrentSession = _t[1];
    var _u = (0, react_1.useState)(false), isPlaying = _u[0], setIsPlaying = _u[1];
    var _v = (0, react_1.useState)(false), moveAttemptedWrong = _v[0], setMoveAttemptedWrong = _v[1];
    var _w = (0, react_1.useState)(1), playbackSpeed = _w[0], setPlaybackSpeed = _w[1];
    var _x = (0, react_1.useState)('white'), boardOrientation = _x[0], setBoardOrientation = _x[1];
    var _y = (0, react_1.useState)(null), exploreFen = _y[0], setExploreFen = _y[1];
    var playbackIntervalRef = (0, react_1.useRef)(null);
    // Reset exploreFen when switching to explore mode
    (0, react_1.useEffect)(function () {
        if (trainingMode === 'explore') {
            setExploreFen(null);
            // Mark game as explored when entering explore mode
            if ((selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.id) && lastExploredGameRef.current !== selectedGame.id) {
                markGameExplored(selectedGame.id);
                lastExploredGameRef.current = selectedGame.id;
            }
        }
    }, [trainingMode, selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.id, markGameExplored]);
    // Initialize game state when game is selected or player color changes
    (0, react_1.useEffect)(function () {
        if (selectedGame) {
            var chess = new chess_js_1.Chess();
            setGameState(chess);
            setIsCorrect(null);
            setHintLevel(0);
            setHintUsedCount(0); // Reset hint counter on new game
            setShowMoveComment(false);
            setMoveAttempts([]);
            setSessionComplete(false);
            setCorrectMoveSquares(null);
            setWrongMoveSquares(null);
            setMoveAttemptedWrong(false);
            var newSession = {
                gameId: selectedGame.id,
                difficulty: difficulty,
                moveAttempts: [],
                startTime: Date.now(),
                totalMoves: trainingMode === 'train'
                    ? playerColor === 'w'
                        ? Math.ceil(selectedGame.moves.length / 2) // White plays ceil(n/2) moves
                        : Math.floor(selectedGame.moves.length / 2) // Black plays floor(n/2) moves
                    : selectedGame.moves.length, // In explore mode, count all moves
                correctMoves: 0,
                incorrectMoves: 0,
                hintsUsed: 0,
            };
            setCurrentSession(newSession);
            if (trainingMode === 'train' && playerColor === 'b' && selectedGame.moves.length > 0) {
                setMoveIndex(0);
                setMessage("White is playing...");
                var timer_1 = setTimeout(function () {
                    setMoveIndex(1);
                    setMessage("Playing as Black. Your turn...");
                }, 1000);
                return function () { return clearTimeout(timer_1); };
            }
            else if (trainingMode === 'explore') {
                setMoveIndex(0);
                setExploreFen(null);
                setMessage('');
            }
            else {
                setMoveIndex(0);
                setMessage("Playing as ".concat(playerColor === 'w' ? 'White' : 'Black', ". Your turn..."));
            }
        }
    }, [selectedGame, playerColor, trainingMode, difficulty]);
    // Get current FEN by replaying moves up to moveIndex
    var getCurrentFen = (0, react_1.useCallback)(function () {
        var chess = new chess_js_1.Chess();
        if (selectedGame) {
            for (var i = 0; i < moveIndex; i++) {
                if (i < selectedGame.moves.length) {
                    var move = selectedGame.moves[i];
                    try {
                        chess.move({
                            from: move.from,
                            to: move.to,
                            promotion: move.promotion,
                        });
                    }
                    catch (_a) {
                        // Skip invalid moves silently
                    }
                }
            }
        }
        return chess.fen();
    }, [selectedGame, moveIndex]);
    var getCurrentPosition = (0, react_1.useCallback)(function () {
        var chess = new chess_js_1.Chess();
        if (selectedGame) {
            for (var i = 0; i < moveIndex; i++) {
                if (i < selectedGame.moves.length) {
                    var move = selectedGame.moves[i];
                    try {
                        chess.move({
                            from: move.from,
                            to: move.to,
                            promotion: move.promotion,
                        });
                    }
                    catch (_a) {
                        // Skip invalid moves
                    }
                }
            }
        }
        return chess;
    }, [selectedGame, moveIndex]);
    var getExpectedMove = (0, react_1.useCallback)(function () {
        if (!selectedGame || moveIndex >= selectedGame.moves.length) {
            return null;
        }
        var currentPos = getCurrentPosition();
        var expectedMove = selectedGame.moves[moveIndex];
        try {
            var result = currentPos.move({
                from: expectedMove.from,
                to: expectedMove.to,
                promotion: expectedMove.promotion,
            });
            return (result === null || result === void 0 ? void 0 : result.san) || null;
        }
        catch (_a) {
            return null;
        }
    }, [selectedGame, moveIndex, getCurrentPosition]);
    var getCurrentMove = (0, react_1.useCallback)(function () {
        if (!selectedGame || moveIndex <= 0 || moveIndex > selectedGame.moves.length) {
            return null;
        }
        return selectedGame.moves[moveIndex - 1];
    }, [selectedGame, moveIndex]);
    var getCurrentMoveNumber = (0, react_1.useCallback)(function () {
        if (moveIndex <= 0)
            return '';
        var isWhiteMove = (moveIndex - 1) % 2 === 0;
        var moveNum = Math.floor((moveIndex - 1) / 2) + 1;
        return isWhiteMove ? "".concat(moveNum, ".") : "".concat(moveNum, "...");
    }, [moveIndex]);
    var getHintData = (0, react_1.useCallback)(function () {
        if (!selectedGame || moveIndex >= selectedGame.moves.length) {
            return { hintSquare: null, hintDestinations: [] };
        }
        var expectedMove = selectedGame.moves[moveIndex];
        return {
            hintSquare: expectedMove.from,
            hintDestinations: [expectedMove.to],
        };
    }, [selectedGame, moveIndex]);
    var handleHint = (0, react_1.useCallback)(function () {
        // EASY MODE: Unlimited, level 0→piece, level 1→destination
        if (difficulty === 'easy') {
            if (hintLevel < 2) {
                setHintLevel(function (prev) { return Math.min(2, prev + 1); });
                setHintUsedCount(function (prev) { return prev + 1; });
                if (currentSession) {
                    setCurrentSession(__assign(__assign({}, currentSession), { hintsUsed: currentSession.hintsUsed + 1 }));
                }
                if (hintLevel === 0) {
                    setMessage('Hint: The highlighted square shows the piece to move.');
                }
                else if (hintLevel === 1) {
                    setMessage('Hint: Move to the highlighted destination.');
                }
            }
            return;
        }
        // MEDIUM MODE: Unlimited, only show piece (hintLevel stays 1)
        if (difficulty === 'medium') {
            if (hintLevel === 0) {
                setHintLevel(1);
                setHintUsedCount(function (prev) { return prev + 1; });
                if (currentSession) {
                    setCurrentSession(__assign(__assign({}, currentSession), { hintsUsed: currentSession.hintsUsed + 1 }));
                }
                setMessage('Hint: The highlighted square shows the piece to move.');
            }
            return;
        }
        // HARD MODE: Only one usage total
        if (difficulty === 'hard') {
            if (hintUsedCount === 0) {
                setHintLevel(1);
                setHintUsedCount(1); // Mark as used
                if (currentSession) {
                    setCurrentSession(__assign(__assign({}, currentSession), { hintsUsed: currentSession.hintsUsed + 1 }));
                }
                setMessage('Hint: The highlighted square shows the piece to move. (Last hint)');
            }
        }
    }, [difficulty, hintLevel, hintUsedCount, currentSession]);
    var playOpponentMove = (0, react_1.useCallback)(function (currentMoveIndex) {
        if (!selectedGame)
            return currentMoveIndex;
        var nextMoveIndex = currentMoveIndex;
        var chess = new chess_js_1.Chess();
        if (selectedGame) {
            for (var i = 0; i < nextMoveIndex; i++) {
                if (i < selectedGame.moves.length) {
                    var m = selectedGame.moves[i];
                    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
                }
            }
        }
        if (chess.turn() !== playerColor && nextMoveIndex < selectedGame.moves.length) {
            return nextMoveIndex + 1;
        }
        return currentMoveIndex;
    }, [selectedGame, playerColor]);
    var handleMove = (0, react_1.useCallback)(function (move) {
        var _a, _b, _c, _d;
        if (!selectedGame)
            return;
        var currentPos = getCurrentPosition();
        var legalMoves = currentPos.moves({ verbose: true });
        var isLegalMove = legalMoves.some(function (m) { return m.from === move.from && m.to === move.to; });
        if (!isLegalMove) {
            setIsCorrect(false);
            setMessage('Invalid move!');
            return;
        }
        if (trainingMode === 'train') {
            var expectedMove = selectedGame.moves[moveIndex];
            if (!expectedMove) {
                setMessage('No more moves in this game.');
                setIsCorrect(null);
                return;
            }
            var moveMatches = expectedMove.from === move.from &&
                expectedMove.to === move.to;
            if (moveMatches) {
                setIsCorrect(true);
                setHintLevel(0);
                setShowMoveComment(true);
                // Detect special move types for sound
                var tempChess = new chess_js_1.Chess(getCurrentFen());
                var result = tempChess.move(move);
                var isCapture = (result === null || result === void 0 ? void 0 : result.captured) !== undefined;
                var isCheck = tempChess.inCheck();
                var isCastle = ((_a = result === null || result === void 0 ? void 0 : result.flags) === null || _a === void 0 ? void 0 : _a.includes('k')) || ((_b = result === null || result === void 0 ? void 0 : result.flags) === null || _b === void 0 ? void 0 : _b.includes('q'));
                var isPromotion = (result === null || result === void 0 ? void 0 : result.promotion) !== undefined;
                // Play appropriate move sound
                playMoveSound(isCapture, isCheck, isCastle, isPromotion);
                // Update highlight at same time as move (in same state batch)
                setCorrectMoveSquares({ from: move.from, to: move.to });
                var attemptIndex = moveAttempts.findIndex(function (a) { return a.moveIndex === moveIndex; });
                if (attemptIndex === -1) {
                    setMoveAttempts(__spreadArray(__spreadArray([], moveAttempts, true), [{ moveIndex: moveIndex, wrongAttempts: 0 }], false));
                }
                if (currentSession) {
                    setCurrentSession(__assign(__assign({}, currentSession), { correctMoves: moveAttemptedWrong ? currentSession.correctMoves : currentSession.correctMoves + 1, incorrectMoves: moveAttemptedWrong ? currentSession.incorrectMoves + 1 : currentSession.incorrectMoves }));
                }
                // Reset for next move
                setMoveAttemptedWrong(false);
                var newIndex_1 = moveIndex + 1;
                if (newIndex_1 < selectedGame.moves.length) {
                    var opponentIndex_1 = playOpponentMove(newIndex_1);
                    if (opponentIndex_1 > newIndex_1) {
                        setMoveIndex(newIndex_1);
                        setMessage('Correct!');
                        // Clear highlight after animation duration
                        setTimeout(function () {
                            setCorrectMoveSquares(null);
                        }, 300);
                        // After opponent move completes, update board state
                        setTimeout(function () {
                            var _a, _b;
                            // Play sound for opponent's move
                            var opponentMove = selectedGame.moves[newIndex_1];
                            if (opponentMove) {
                                var tempChess_1 = new chess_js_1.Chess();
                                for (var i = 0; i < newIndex_1; i++) {
                                    var m = selectedGame.moves[i];
                                    tempChess_1.move({ from: m.from, to: m.to, promotion: m.promotion });
                                }
                                var result_1 = tempChess_1.move({ from: opponentMove.from, to: opponentMove.to, promotion: opponentMove.promotion });
                                var isCapture_1 = (result_1 === null || result_1 === void 0 ? void 0 : result_1.captured) !== undefined;
                                var isCheck_1 = tempChess_1.inCheck();
                                var isCastle_1 = ((_a = result_1 === null || result_1 === void 0 ? void 0 : result_1.flags) === null || _a === void 0 ? void 0 : _a.includes('k')) || ((_b = result_1 === null || result_1 === void 0 ? void 0 : result_1.flags) === null || _b === void 0 ? void 0 : _b.includes('q'));
                                var isPromotion_1 = (result_1 === null || result_1 === void 0 ? void 0 : result_1.promotion) !== undefined;
                                playMoveSound(isCapture_1, isCheck_1, isCastle_1, isPromotion_1);
                            }
                            setMoveIndex(opponentIndex_1);
                            setShowMoveComment(false);
                            if (opponentIndex_1 >= selectedGame.moves.length) {
                                if (currentSession) {
                                    setCurrentSession(__assign(__assign({}, currentSession), { completedAt: Date.now() }));
                                }
                                setSessionComplete(true);
                                setMessage('Game complete! Well done!');
                                setIsCorrect(null);
                            }
                            else {
                                setMessage('Your turn...');
                                setIsCorrect(null);
                            }
                        }, 400);
                        return;
                    }
                }
                setMoveIndex(newIndex_1);
                // Clear highlight after animation duration
                setTimeout(function () {
                    setCorrectMoveSquares(null);
                }, 300);
                if (newIndex_1 >= selectedGame.moves.length) {
                    if (currentSession) {
                        setCurrentSession(__assign(__assign({}, currentSession), { completedAt: Date.now() }));
                    }
                    setSessionComplete(true);
                    setMessage('Game complete! Well done!');
                }
                else {
                    setMessage('Correct! Your turn...');
                    setShowMoveComment(false);
                }
            }
            else {
                setIsCorrect(false);
                setWrongMoveSquares({ from: move.from, to: move.to });
                setMessage('Incorrect. Try again.');
                setMoveAttemptedWrong(true);
                var attemptIndex = moveAttempts.findIndex(function (a) { return a.moveIndex === moveIndex; });
                if (attemptIndex === -1) {
                    setMoveAttempts(__spreadArray(__spreadArray([], moveAttempts, true), [{ moveIndex: moveIndex, wrongAttempts: 1 }], false));
                }
                else {
                    var updated = __spreadArray([], moveAttempts, true);
                    updated[attemptIndex].wrongAttempts += 1;
                    setMoveAttempts(updated);
                }
                setTimeout(function () {
                    setWrongMoveSquares(null);
                }, 400);
            }
        }
        else {
            // EXPLORE MODE - apply move and check if it matches PGN
            var currentFen = exploreFen || getCurrentFen();
            var exploreChess = new chess_js_1.Chess(currentFen);
            var result = exploreChess.move(move);
            if (result) {
                setExploreFen(exploreChess.fen());
                // Detect special move types for sound
                var isCapture = result.captured !== undefined;
                var isCheck = exploreChess.inCheck();
                var isCastle = ((_c = result.flags) === null || _c === void 0 ? void 0 : _c.includes('k')) || ((_d = result.flags) === null || _d === void 0 ? void 0 : _d.includes('q'));
                var isPromotion = result.promotion !== undefined;
                // Play appropriate move sound
                playMoveSound(isCapture, isCheck, isCastle, isPromotion);
                // Check if this move matches the next PGN move
                if (selectedGame && moveIndex < selectedGame.moves.length) {
                    var expectedMove = selectedGame.moves[moveIndex];
                    // Compare both directions since PGN can store moves as "from-to" or "e2e4"
                    var moveMatches = (expectedMove.from === move.from && expectedMove.to === move.to) ||
                        (expectedMove.notation === result.san);
                    if (moveMatches) {
                        // Advance through PGN - no auto-play, user plays both sides
                        setMoveIndex(moveIndex + 1);
                        setCorrectMoveSquares({ from: move.from, to: move.to });
                        setTimeout(function () { return setCorrectMoveSquares(null); }, 300);
                        setMessage("Correct! ".concat(result.san));
                        setIsCorrect(true);
                    }
                    else {
                        setMessage("Moved: ".concat(result.san, " (not the PGN move)"));
                        setIsCorrect(null);
                    }
                }
                else {
                    setMessage("Moved: ".concat(result.san));
                    setIsCorrect(null);
                }
            }
            else {
                setIsCorrect(false);
                setMessage('Invalid move!');
            }
        }
    }, [selectedGame, moveIndex, trainingMode, playerColor, getCurrentPosition, playOpponentMove, moveAttempts, currentSession, exploreFen, getCurrentFen, playMoveSound]);
    var handleSelectGame = (0, react_1.useCallback)(function (game) {
        setSelectedGame(game);
        setMoveIndex(0);
        setTrainingMode('train');
        setPlayerColor('w');
        setExploreFen(null);
    }, [setSelectedGame]);
    var handleResetGame = (0, react_1.useCallback)(function () {
        if (selectedGame) {
            setIsCorrect(null);
            setHintLevel(0);
            setHintUsedCount(0);
            setWrongMoveSquares(null);
            setCorrectMoveSquares(null);
            setMoveAttemptedWrong(false);
            if (trainingMode === 'train' && playerColor === 'b' && selectedGame.moves.length > 0) {
                setMoveIndex(0);
                setMessage("White is playing...");
                setTimeout(function () {
                    setMoveIndex(1);
                    setMessage("Playing as Black. Your turn...");
                }, 1000);
            }
            else if (trainingMode === 'explore') {
                setMoveIndex(0);
                setExploreFen(null);
                setMessage('');
            }
            else {
                setMoveIndex(0);
                setMessage("Playing as ".concat(playerColor === 'w' ? 'White' : 'Black', ". Your turn..."));
            }
        }
    }, [selectedGame, playerColor, trainingMode]);
    var handleCompleteGame = (0, react_1.useCallback)(function () {
        if (selectedGame) {
            var newCompleted = new Set(completedGames);
            newCompleted.add(selectedGame.id);
            setCompletedGames(newCompleted);
            saveCompletedGame(selectedGame.id); // Save to context
            setMessage('Game marked as complete!');
        }
    }, [selectedGame, completedGames, saveCompletedGame]);
    var handleNavigateMove = (0, react_1.useCallback)(function (index) {
        if (selectedGame && index >= 0 && index <= selectedGame.moves.length) {
            if (trainingMode === 'train' && index > moveIndex) {
                setMessage('Complete the current move to continue');
                return;
            }
            setMoveIndex(index);
            setIsCorrect(null);
            // In explore mode, reset exploreFen to follow PGN when navigating
            if (trainingMode === 'explore') {
                setExploreFen(null);
            }
            var newPos = new chess_js_1.Chess();
            for (var i = 0; i < index; i++) {
                if (i < selectedGame.moves.length) {
                    var move = selectedGame.moves[i];
                    newPos.move({
                        from: move.from,
                        to: move.to,
                        promotion: move.promotion,
                    });
                }
            }
            var currentMove_1 = selectedGame.moves[index - 1];
            if (currentMove_1) {
                setMessage("Move ".concat(currentMove_1.san));
            }
        }
    }, [selectedGame, moveIndex, trainingMode]);
    var handleKeyboardNavigation = (0, react_1.useCallback)(function (direction) {
        if (trainingMode === 'train' && direction === 'next' && moveIndex >= ((selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.moves.length) || 0)) {
            setMessage('Game complete!');
            return;
        }
        if (direction === 'next') {
            handleNavigateMove(Math.min(((selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.moves.length) || 0), moveIndex + 1));
        }
        else {
            handleNavigateMove(Math.max(0, moveIndex - 1));
        }
    }, [selectedGame, moveIndex, trainingMode, handleNavigateMove]);
    var handlePlaybackStart = (0, react_1.useCallback)(function () {
        if (trainingMode !== 'explore' || !selectedGame)
            return;
        setIsPlaying(true);
        var delayMs = (2000 / playbackSpeed);
        var nextIndex = moveIndex + 1;
        var playNextMove = function () {
            var _a, _b;
            if (nextIndex <= selectedGame.moves.length) {
                // Play sound for this move
                var moveToPlay = selectedGame.moves[nextIndex - 1];
                if (moveToPlay) {
                    var tempChess = new chess_js_1.Chess();
                    for (var i = 0; i < nextIndex - 1; i++) {
                        var m = selectedGame.moves[i];
                        tempChess.move({ from: m.from, to: m.to, promotion: m.promotion });
                    }
                    var result = tempChess.move({ from: moveToPlay.from, to: moveToPlay.to, promotion: moveToPlay.promotion });
                    var isCapture = (result === null || result === void 0 ? void 0 : result.captured) !== undefined;
                    var isCheck = tempChess.inCheck();
                    var isCastle = ((_a = result === null || result === void 0 ? void 0 : result.flags) === null || _a === void 0 ? void 0 : _a.includes('k')) || ((_b = result === null || result === void 0 ? void 0 : result.flags) === null || _b === void 0 ? void 0 : _b.includes('q'));
                    var isPromotion = (result === null || result === void 0 ? void 0 : result.promotion) !== undefined;
                    playMoveSound(isCapture, isCheck, isCastle, isPromotion);
                }
                handleNavigateMove(nextIndex);
                nextIndex += 1;
                if (nextIndex > selectedGame.moves.length) {
                    setIsPlaying(false);
                    return;
                }
                playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
            }
        };
        playbackIntervalRef.current = setTimeout(playNextMove, delayMs);
    }, [trainingMode, selectedGame, moveIndex, playbackSpeed, handleNavigateMove, playMoveSound]);
    var handlePlaybackPause = (0, react_1.useCallback)(function () {
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
            clearTimeout(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
        }
    }, []);
    var handlePlaybackReset = (0, react_1.useCallback)(function () {
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
            clearTimeout(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
        }
        handleNavigateMove(0);
    }, [handleNavigateMove]);
    var handleSpeedChange = (0, react_1.useCallback)(function (newSpeed) {
        setPlaybackSpeed(newSpeed);
        if (isPlaying) {
            handlePlaybackPause();
        }
    }, [isPlaying, handlePlaybackPause]);
    (0, react_1.useEffect)(function () {
        if (trainingMode === 'train' || !selectedGame) {
            handlePlaybackPause();
        }
    }, [trainingMode, selectedGame, handlePlaybackPause]);
    (0, react_1.useEffect)(function () {
        return function () {
            if (playbackIntervalRef.current) {
                clearTimeout(playbackIntervalRef.current);
            }
        };
    }, []);
    var lastMove = moveIndex > 0 ? selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.moves[moveIndex - 1] : undefined;
    var currentMove = getCurrentMove();
    var hintData = getHintData();
    return (<div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] gap-6">
        <div className="flex flex-col gap-4">
          {sessionComplete && selectedGame && currentSession && (<SessionFeedback_1.SessionFeedback session={currentSession} moveAttempts={moveAttempts} onReplay={function () {
                setMoveIndex(0);
                setSessionComplete(false);
                setIsCorrect(null);
            }} onNewGame={function () {
                setSelectedGame(null);
                setSessionComplete(false);
            }}/>)}

          <div className="flex flex-col items-center gap-3">
            {selectedGame && gameState ? (<ChessBoard_1.ChessBoard fen={trainingMode === 'explore' && exploreFen ? exploreFen : getCurrentFen()} onMove={handleMove} onNavigate={handleKeyboardNavigation} disabled={moveIndex >= ((selectedGame === null || selectedGame === void 0 ? void 0 : selectedGame.moves.length) || 0) && trainingMode === 'train'} lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : undefined} orientation={trainingMode === 'explore' ? boardOrientation : (playerColor === 'w' ? 'white' : 'black')} hintSquare={trainingMode === 'train' && hintLevel >= 1 ? hintData.hintSquare : null} hintDestinations={trainingMode === 'train' && hintLevel >= 2 ? hintData.hintDestinations : []} wrongMove={isCorrect === false} wrongMoveSquares={wrongMoveSquares} correctMoveSquares={correctMoveSquares} playerColor={trainingMode === 'train' ? playerColor : null}/>) : (<div className="w-full max-w-md aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <p className="text-gray-400">Select a game to begin</p>
              </div>)}

            {selectedGame && (<div className="flex items-center gap-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
                <button_1.Button variant="ghost" size="sm" onClick={function () { return handleNavigateMove(0); }} disabled={moveIndex === 0} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0" title="First move">
                  <lucide_react_1.ChevronsLeft className="h-4 w-4"/>
                </button_1.Button>
                <button_1.Button variant="ghost" size="sm" onClick={function () { return handleKeyboardNavigation('prev'); }} disabled={moveIndex === 0} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0" title="Previous move">
                  <lucide_react_1.ChevronLeft className="h-4 w-4"/>
                </button_1.Button>
  <span className="text-xs text-gray-400 min-w-[60px] text-center">
    {trainingMode === 'explore' ? "".concat(moveIndex, " / ").concat(selectedGame.moves.length) : ''}
  </span>
                <button_1.Button variant="ghost" size="sm" onClick={function () { return handleKeyboardNavigation('next'); }} disabled={trainingMode === 'train' ? moveIndex >= selectedGame.moves.length : moveIndex >= selectedGame.moves.length} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0" title="Next move">
                  <lucide_react_1.ChevronRight className="h-4 w-4"/>
                </button_1.Button>
                <button_1.Button variant="ghost" size="sm" onClick={function () { return handleNavigateMove(selectedGame.moves.length); }} disabled={trainingMode === 'train' || moveIndex >= selectedGame.moves.length} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0" title="Last move">
                  <lucide_react_1.ChevronsRight className="h-4 w-4"/>
                </button_1.Button>

                {trainingMode === 'train' && moveIndex < selectedGame.moves.length && (<>
                    <div className="w-px h-6 bg-gray-700 mx-1"/>
                    <button_1.Button variant="ghost" size="sm" onClick={handleHint} disabled={difficulty === 'easy' ? hintLevel >= 2 :
                    difficulty === 'medium' ? hintLevel >= 1 :
                        hintUsedCount >= 1} className={"text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 h-8 px-3 gap-1.5 ".concat(hintLevel > 0 ? 'text-amber-400 bg-amber-900/20' : '')} title={difficulty === 'hard' && hintUsedCount >= 1 ? 'Hint already used' :
                    hintLevel === 0 ? 'Get a hint' : 'Hint active'}>
                      <lucide_react_1.Lightbulb className="h-4 w-4"/>
                      <span className="text-xs">Hint</span>
                    </button_1.Button>
                  </>)}
              </div>)}

            {selectedGame && trainingMode === 'explore' && (<PlaybackControls_1.PlaybackControls isPlaying={isPlaying} onPlay={handlePlaybackStart} onPause={handlePlaybackPause} onReset={handlePlaybackReset} speed={playbackSpeed} onSpeedChange={handleSpeedChange} disabled={moveIndex >= selectedGame.moves.length}/>)}

            {selectedGame && (<div className="flex items-center gap-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
                <button_1.Button variant="ghost" size="sm" onClick={function () {
                var prevIndex = Math.max(0, currentGameIndex - 1);
                if (prevIndex >= 0 && prevIndex < games.length) {
                    setSelectedGame(games[prevIndex]);
                    setMoveIndex(0);
                }
            }} disabled={currentGameIndex <= 0} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 px-3 gap-1.5" title="Previous game">
                  <lucide_react_1.ChevronLeft className="h-4 w-4"/>
                  <span className="text-xs hidden sm:inline">Previous</span>
                </button_1.Button>
                <span className="text-xs text-gray-400 min-w-[50px] text-center">
                  {currentGameIndex + 1} / {games.length}
                </span>
                <button_1.Button variant="ghost" size="sm" onClick={function () {
                var nextIndex = currentGameIndex + 1;
                if (nextIndex < games.length) {
                    setSelectedGame(games[nextIndex]);
                    setMoveIndex(0);
                }
            }} disabled={currentGameIndex >= games.length - 1} className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 px-3 gap-1.5" title="Next game">
                  <span className="text-xs hidden sm:inline">Next</span>
                  <lucide_react_1.ChevronRight className="h-4 w-4"/>
                </button_1.Button>
              </div>)}

            {selectedGame && (currentMove === null || currentMove === void 0 ? void 0 : currentMove.comment) && trainingMode === 'explore' && (<div className="w-full max-w-[400px] rounded-lg p-4 border-l-3" style={{
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                borderLeft: '3px solid rgba(139, 92, 246, 0.5)',
            }}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                      {getCurrentMoveNumber()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-purple-300 mb-1">
                      {currentMove.san}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#d4c4f5', lineHeight: '1.6' }}>
                      {currentMove.comment}
                    </p>
                  </div>
                </div>
              </div>)}
          </div>

          {selectedGame && (<TrainingPanel_1.TrainingPanel game={selectedGame} moveIndex={moveIndex} trainingMode={trainingMode} playerColor={playerColor} message={message} isCorrect={isCorrect} expectedMove={trainingMode === 'explore' ? getExpectedMove() : null} difficulty={difficulty} onModeChange={setTrainingMode} onColorChange={setPlayerColor} onFlipBoard={function () { return setBoardOrientation(function (o) { return o === 'white' ? 'black' : 'white'; }); }} onDifficultyChange={setDifficulty} onReset={handleResetGame} onNavigateMove={handleNavigateMove} onCompleteGame={handleCompleteGame} isCompleted={completedGames.has(selectedGame.id)}/>)}
        </div>

        {selectedGame && trainingMode === 'explore' && (<div className="flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Moves & Comments</h3>
            <MovesPanel_1.MovesPanel game={selectedGame} moveIndex={moveIndex} onNavigateMove={handleNavigateMove} trainingMode={trainingMode} playerColor={playerColor}/>
          </div>)}

        <div className="flex-shrink-0">
          <GameList_1.GameList games={games} selectedGame={selectedGame} onSelectGame={handleSelectGame} completedGames={completedGames}/>
        </div>
      </div>
    </div>);
}
