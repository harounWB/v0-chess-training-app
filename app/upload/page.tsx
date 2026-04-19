'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PGNUpload } from '@/components/PGNUpload';
import { useGameContext } from '@/lib/GameContext';
import { useAuth } from '@/lib/AuthContext';
import { Game } from '@/lib/types';
import { scopeGamesForFile } from '@/lib/GameContext';
import { BookOpen, Play, Upload as UploadIcon, AlertCircle, FileText, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UploadPage() {
  const router = useRouter();
  const { games, setGames, setSelectedGame, clearGameData } = useGameContext();
  const { user, isGuest } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelectGames, setShowSelectGames] = useState(false);
  const [pgnFiles, setPgnFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load list of PGN files
  useEffect(() => {
    const loadPgnFiles = async () => {
      try {
        setLoadingFiles(true);
        // Since we can't dynamically list files from public folder at runtime,
        // we'll use a predefined list based on the folder contents
        const files = [
          '1.b3. Expert Repertoire for White Part 1.pgn',
          '1.b3. Expert Repertoire for White Part 2.pgn',
          '1.c3 Venom. A Reverse Caro-Kann & London System Repertoire.pgn',
          '1.c4 e5. Complete Repertoire for Black.pgn',
          '1.c4 simplified.pgn',
          '1.d4 According to Dreev. Fight the Bogo-Indian Defense # Alexey Dreev & Pier Luigi Basso # Modern Chess # 2025.pgn',
          '1.d4 According to Dreev. Fight the Minor Lines.pgn',
          '1.d4 According to Dreev. Fight the Queen\'s Gambit Accepted # Alexey Dreev & Pier Luigi Basso # Modern Chess # 2025.pgn',
          '1.d4 According to Dreev. Fight the Slav Defense.pgn',
          '1.d4 According to Dreev. Play the Catalan Part 1.pgn',
          '1.d4 According to Dreev. Play the Catalan Part 2.pgn',
          '1.d4 d5 2.c4 e6 3.Nc3 c5. Complete Repertoire for Black.pgn',
          '1.d4 d5 2.c4. Complete Repertoire for White.pgn',
          '1.d4 d5 Krishnater\'s Killer Repertoire.pgn',
          '1.d4 for Ambitious Chess Improvers.pgn',
          '1.d4 Nf6 2.c4 e6 3.Bf4. Complete Repertoire for White.pgn',
          '1.d4 Nf6 2.c4 e6 3.g3. Repertoire against Bogo Indian & Benoni.pgn',
          '1.d4 Nf6 2.c4 e6 3.Nf3 d5. Ragozin & Queen\'s Gambit with 4...a6 for Black # Kuljasevic Davorin # Modern Chess # 2018.pgn',
          '1.d4 Nf6 2.c4 g6 3.h4. Aggressive Repertoire for White.pgn',
          '1.d4 Nf6 2.Nf3 e6 3.Bg5. Complete repertoire for White.pgn',
          '1.d4 Nf6 2.Nf3 g6 3.Nbd2. Practical Repertoire for White.pgn',
          '1.d4 Repertoire for White.pgn',
          '1.d4 simplified.pgn',
          '1.e4 c5 2.Nf3 Nc6. Repertoire against 3.Bb5 & Nc3.pgn',
          '1.e4 c5 2.Nf3 Nf6 Play the Nimzowitsch Sicilian.pgn',
          '1.e4 e5 Club Player\'s Dynamite.pgn',
          '1.e4 e5 for Black. Everything except Italian & Ruy Lopez.pgn',
          '1.e4 e5 for Black. Repertoire against the Italian Game.pgn',
          '1.e4 e5 for Black. Repertoire against the Ruy Lopez.pgn',
          '1.e4 e5! A Comprehensive Black Repertoire against 1.e4.pgn',
          '1.e4 e5. Repertoire for Black against the Deviations from Ruy Lopez & Italian # Arjun Kalyan # Modern Chess # 2024.pgn',
          '1.e4 New York Style for White volume 2.pgn',
          '1.e4 Part 1.pgn',
          '1.e4 Part 2.pgn',
          '1.e4 Repertoire for White.pgn',
          '1.e4. A Comprehensive White Repertoire.pgn',
          '1.e4. A Positional Repertoire for Club Players.pgn',
          '1.Nf3 d5 2 g3 Nc6. Practical Solution for Black.pgn',
          '1.Nf3 d5 2.g3 - Expert Repertoire for White Part 1.pgn',
          '1.Nf3 d5 2.g3 - Expert Repertoire for White Part 2.pgn',
          '1.Nf3 d5 2.g3. Play the Reti.pgn',
          '1.Nf3 d5 for Black Refined Part 1.pgn',
          '1.Nf3 Nf6 2.c4 g6 3.Nc3. Expert Anti-Gruenfeld Repertoire.pgn',
          '1.Nf3. Practical Reti Repertoire for White.pgn',
          '1.Nf3. The Reversed Queen\'s Indian.pgn',
          '100 Repertoires Alekhine Defense.pgn',
          '100 Repertoires. King\'s Indian Attack.pgn',
          '100 Repertoires. Nimzowitsch Sicilian.pgn',
          '100 Repertoires. Reti (1.Nf3).pgn',
          '100 Repertoires. Sicilian O\'Kelly.pgn',
          '11 Opening Traps with 1.e4.pgn',
          '3.f3 Against the King\'s Indian & Gruenfeld.pgn',
          '700 Opening Traps.pgn',
          'A beginner\'s blitz repertoire.pgn',
          'A Black Repertoire for Ambitious Chess Improvers. Fighting 1.e4.pgn',
          'A Blitz Repertoire for Black.pgn',
          'A Grand Master Guide. The Reti King\'s Indian Attack & others based on the QGD # Alex Colovic # Chessable # 2017.pgn',
          'A Master\'s Guide to the Gruenfeld vs 1.d4 & 1.Nf3.pgn',
          'A Modern Repertoire Against The Catalan.pgn',
          'Accelerate The Dragon.pgn',
          'Advance Variation against French & Caro-Kann # Ioannis Papaioannou & Petar G. Arnaudov # Modern Chess # 2022.pgn',
          'Against the Morra Gambit.pgn',
          'Aggressive Repertoire against the Catalan. London & Jobava London # Kushager Krishnater # Modern Chess # 2025.pgn',
          'Aggressive repertoire against the French Defense Part 1.pgn',
          'Aggressive repertoire against the French Defense Part 2.pgn',
          'Aggressive Repertoire against the Gruenfeld.pgn',
          'Alapin Sicilian Merged.pgn',
          'Alekhine Defence. Complete Solution to 1.e4.pgn',
          'Alekhine Defense. Lemos Formula.pgn',
          'Alekhine Defense. The Dark Knight Rises.pgn',
          'Alekhine\'s Defense.pgn',
          'Ambitious Repertoire against the Caro-Kann.pgn',
          'Ambitious Repertoire against the Catalan.pgn',
          'Ambitious Repertoire against the English Opening.pgn',
          'Ambitious Repertoire against the Gruenfeld.pgn',
          'Ambush 1.e4. Fighting 1... e5, Scandi & Sidelines.pgn',
          'Anti Anti-Sicilians.pgn',
          'Anti-Sicilian 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Qxd4.pgn',
          'Anti-Sicilian Repertoire. 2...e6 & Sidelines.pgn',
          'Anti-Sicilians with ...e7-e6.pgn',
          'Anti-Sicilians.pgn',
          'Antidotes to anti-Dutch systems.pgn',
          'Arkhangelsk Variation Lifetime Solution for Black.pgn',
          'Attacking Repertoire for Club Players for Black.pgn',
          'Attacking Repertoire for Club Players. 1.e4.pgn',
          'Beat 1.d4 systems.pgn',
          'Beat Bad & Pesky Openings.pgn',
          'Beat the Alekhine. Four Pawns Attack.pgn',
          'Beat the Caro-Kann. Two-Knights Variation.pgn',
          'Beat the Dynamic Defences after 1.d4 d5 2.c4.pgn',
          'Beat the French Defense with 3.Nd2.pgn',
          'Beat the Petroff & Others.pgn',
          'Beat the Sicilian Practical Repertoire for White.pgn',
          'Beating The English.pgn',
          'Beating the Triangle. Tarrasch & Rare Systems.pgn',
          'Benko Vienna.pgn',
          'Benoni simplified.pgn',
          'Berlin Defense.pgn',
          'Bishop\'s Opening. Lemos Formula.pgn',
          'Black is Back. Old Benoni.pgn',
          'Black vs. Anti-Sicilians. Tournament Edition.pgn',
          'Blast the Rossolimo. Ferguson\'s Cannon Variation.pgn',
          'Break Down Anti-Sicilians.pgn',
          'Break the Rules. Play the Trompowsky!.pgn',
          'Breathe Fire. The Dragon Sicilian.pgn',
          'Butcher The Sicilian.pgn',
          'Caro Kann Course for Black.pgn',
          'Caro Kann volume 2 for black.pgn',
          'Caro-Kann According to Dreev Beat the Advance Variation with 3...c5.pgn',
          'Caro-Kann Defense.pgn',
          'Caro-Kann. Surprise Weapons.pgn',
          'Caro-Kann.pgn',
          'Caruana\'s Ruy Lopez Dark Archangel.pgn',
          'Catalan Refined. Full Repertoire for White after 1.d4 Nf6 2.c4 e6 3.g3 # Ioannis Papaioannou # Modern Chess # 2025.pgn',
          'Challenge the Gruenfeld with Bg5.pgn',
          'Chebanenko Slav.pgn',
          'Chess Explained\'s Benko Repertoire. A complete answer to 1.d4.pgn',
          'Classical Anti-Scotch Repertoire.pgn',
          'Classical Repertoire Against Bogo-Indian Defence.pgn',
          'Classical Sicilian. Expert Repertoire for Black.pgn',
          'Club the Caro-Kann. The Caveman Variation.pgn',
          'Combat the Caro-Kann with 3.exd5.pgn',
          'Common Opening Traps and Blunders 1. e4 Part 1.pgn',
          'Common Opening Traps and Blunders 1. e4 Part 2.pgn',
          'Common Opening Traps and Blunders 1. e4 Part 3.pgn',
          'Complete Caro-Kann Repertoire for Black Part 1.pgn',
          'Complete Caro-Kann Repertoire for Black Part 2.pgn',
          'Complete Caro-Kann Repertoire for Black Part 3.pgn',
          'Complete Guide to the Ruy Lopez Exchange Structure.pgn',
          'Complete Modern Benoni Repertoire Part 1.pgn',
          'Complete Modern Benoni Repertoire Part 2.pgn',
          'Complete Najdorf Repertoire for Black Part 1.pgn',
          'Complete Najdorf Repertoire for Black Part 2.pgn',
          'Complete Najdorf Repertoire for Black Part 3.pgn',
          'Complete Rauzer Repertoire for Black.pgn',
          'Complete Repertoire against 1.d4. Late Benoni.pgn',
          'Complete Repertoire against Alekhine & Scandinavian.pgn',
          'Complete Repertoire against Gruenfeld Defence. Play the Russian System # Petar G. Arnaudov # Modern Chess # 2016.pgn',
          'Complete Repertoire against King s Indian Defence.pgn',
          'Complete Repertoire against the Benko Gambit.pgn',
          'Complete Repertoire against the Catalan.pgn',
          'Complete Repertoire against Veresov Trompowsky & London.pgn',
          'Complete Repertoire for White after 1.c4 e5 2.g3 Part 1.pgn',
          'Complete Repertoire for White after 1.c4 e5 2.g3 Part 2.pgn',
          'Complete Repertoire for White after 1.d4 Nf6 2.c4 g6 3.g3 Part 1.pgn',
          'Complete Repertoire for White after 1.d4 Nf6 2.c4 g6 3.g3 Part 2.pgn',
          'Complete Repertoire for White Against Petroff Defence.pgn',
          'Complete Scotch Repertoire.pgn',
          'Complete Spanish Repertoire for Black. Sidelines.pgn',
          'Complete Spanish Repertoire for Black. The Breyer System.pgn',
          'Conquer the Caro-Kann. The Shirov Attack.pgn',
          'Counterblow. A Complete Fighting Repertoire for Beginners.pgn',
          'Crush 1.b3 with 1...e5!.pgn',
          'Crush the Alekhine & Scandinavian!.pgn',
          'Crush the Caro-Kann.pgn',
          'Crush the Dragon!.pgn',
          'Crush the King\'s Gambit!.pgn',
          'Crush the London.pgn',
          'Crush the Nimzo-Indian Defense.pgn',
          'Crush the Slav with the Boor Attack.pgn',
          'Crush the Taimanov!.pgn',
          'David Anton teaches 1.e4 e5.pgn',
          'Demolish the London System.pgn',
          'Dethrone the King\'s Indian Part 1. Bayonet Attack for White.pgn',
          'Dethrone the King\'s Indian Part 2. Sidelines for White.pgn',
          'Dirty Harry Sicilian.pgn',
          'Dismantling the King\'s Indian. Razor-Sharp Makogonov.pgn',
          'Dismantling the Sicilian - A Complete Modern Repertoire for White #Jesus de la Villa & Max Illingworth #Chessable #2018.pgn',
          'Dragon Fire. Tactics for Black in the Sicilian Dragon.pgn',
          'Dubovs Explosive Italian.pgn',
          'Dvoretsky\'s Endgame Manual 5th Edition. revised by GM Karsten Mueller # Mark Dvoretsky & Erwin L\'Ami # Chessable # 2021.pgn',
          'Dynamic Anti-Catalan Repertoire.pgn',
          'Dynamite 1.e4. Advance French for White.pgn',
          'English 1.c4 unpublished.pgn',
          'English Breakfast. Romain Edouard\'s Repertoire Against 1.c4.pgn',
          'English, Réti and sidelines (2020).pgn',
          'Erwin\'s Opening Lab. The Cozio Defense.pgn',
          'Erwin\'s Opening Lab. The Dubov Tarrasch.pgn',
          'Essential Chess Calculation Guide Volume1. Creative Play # Swapnil Dhopade & Surya Shekhar Ganguly # Chessable.pgn',
          'Every Gambit Refuted.pgn',
          'Expert Repertoire against the Caro-Kann.pgn',
          'Expert Repertoire against the Catalan.pgn',
          'Expert Repertoire against the Italian Part 1.pgn',
          'Expert Repertoire against the Italian Part 2.pgn',
          'Expert Repertoire against the Nimzo-Indian Defence Part 1.pgn',
          'Expert Repertoire Against the Ragozin & Vienna.pgn',
          'Fight 1.e4 like Caruana.pgn',
          'Fight Like Kramnik. Play 1. Nf3! The Reti.pgn',
          'Fight Like Magnus, The Sicilian.pgn',
          'Fight the Anti-Sicilians.pgn',
          'Fight the Catalan Opening Top-Level Repertoire for Black.pgn',
          'Fight the English Opening. Jobava\'s Repertoire.pgn',
          'Fight the Queen s Gambit with the Vienna Variation.pgn',
          'Fighting Anti-Sicilians for the Najdorf player.pgn',
          'Fighting the Sidelines after 1.d4 Nf6.pgn',
          'Fire & Tactics. The Ultimate Anti Sicilian & Accelerated Dragon.pgn',
          'Fischer\'s Weapon Against the Najdorf. The Sozin Attack.pgn',
          'Four Horsemen. The Sicilian 4 Knights Defense.pgn',
          'French Defense According to Dreev - Tarrasch, Advance Variation.pgn',
          'French Defense. Advance Variation & Sidelines.pgn',
          'French Defense. Classical Repertoire against 3.Nd2.pgn',
          'French Defense. Play the Winawer against 3.Nc3.pgn',
          'French Defense. The Solid Rubinstein Variation.pgn',
          'From Berlin to Rio 1.e4 e5 for Black.pgn',
          'Gambit Beginner Guide.pgn',
          'Gambit Killer.pgn',
          'Gledura\'s Queen\'s Gambit Accepted.pgn',
          'GM Avrukh Against the Scotch Game.pgn',
          'GM Rafael Leitao\'s. Fight The Slav Defense.pgn',
          'Go for The Throat. Play 1.d4.pgn',
          'Grandmaster Gambits 1.e4 Part 1.pgn',
          'Grandmaster Gambits 1.e4 Part 2. Aggressive Lines.pgn',
          'Great Gambits. The Greco.pgn',
          'Gustafsson\'s Aggressive 1.e4 Part 1.pgn',
          'Gustafsson\'s Aggressive 1.e4 Part 2.pgn',
          'Hammer\'s Nimzo-Indian.pgn',
          'Harikrishna, Pentala - French Toast - How Harikrishna fries 1... e6 (2019).pgn',
          'Healthy Opening Habits for Middlegame Success.pgn',
          'How to Punish Unprincipled Opening Play.pgn',
          'How to Reassess Your Chess. Chess Mastery Through Chess Imbalances # Jeremy Silman & Maurice Ashley # Chessable # 2023.pgn',
          'Huy\'s Original Repertoire Spielmann-Indian.pgn',
          'Iron English Botvinnik Variation.pgn',
          'Italian Game According to Jobava. Complete Repertoire for White # Baadur Jobava & Pier Luigi Basso # Modern Chess # 2024.pgn',
          'Jobava London Reversed. Top-Level Reperoire for Black # Baadur Jobava & Pier Luigi Basso # Modern Chess # 2025.pgn',
          'Jobava\'s French Defense. Advance Variation & Sidelines # Baadur Jobava & Pier Luigi Basso # Modern Chess # 2025.pgn',
          'Jobava\'s French Defense. Play the Fort Knox.pgn',
          'Kalyan\'s Lethal Italian.pgn',
          'Kan Sicilian.pgn',
          'Keep It Simple. 1.d4.pgn',
          'Keep It Simple. 1.e4. 2.0.pgn',
          'Keep It Simple. 1.e4.pgn',
          'Killer Dutch Middlegames.pgn',
          'Killing it with the King\'s Gambit.pgn',
          'King\'s Anti Sicilians For Black.pgn',
          'King\'s Indian Attack.pgn',
          'King\'s Indian Defence. Expert Repertoire for Black Part 1.pgn',
          'King\'s Indian Defence. Expert Repertoire for Black Part 2.pgn',
          'King\'s Indian Defence. Pawn Structures Tactical Ideas Endgames & Theoretical Trends # Modern Chess Team # Modern Chess.pgn',
          'King\'s Indian Defense.pgn',
          'King\'s Indian in thirty classic games.pgn',
          'King\'s Indian Simplified.pgn',
          'London System- 1...Nf6 and 2...c5.pgn',
          'London System- 2...Bf5 or 2...Bg4.pgn',
          'London System- Against Dutch Defense.pgn',
          'London System- Against King\'s Indian Defense.pgn',
          'London System- Against Queen\'s Indian Defense.pgn',
          'London System- Main Line, 5...Bf5.pgn',
          'London System- Main Line, 5...e6.pgn',
          'London System- Main Line, 5...Qb6, g6, cxd4.pgn',
          'London System- Other Lines, 1...Nf6 and 2...b5.pgn',
          'London System- Other Lines, 2...Nh5.pgn',
          'London System- Other Lines, 4...Qe7, Ne7.pgn',
          'London System.pgn',
          'London-Camp-Part-1.pgn',
          'London-Camp-Part-2.pgn',
          'Long Live the King\'s Gambit.pgn',
          'Marin\'s Solution to 1.Nf3 Part 1.pgn',
          'Marin\'s Solution to 1.Nf3 Part 2.pgn',
          'Marin\'s Solution to 1.Nf3 Part 3.pgn',
          'Marin, Mihail - Play the Bogo-Indian Defence - Part 1 (2020).pgn',
          'Marin, Mihail - Play the Bogo-Indian Defence - Part 1 (Pawn Structure Chapters) (2020).pgn',
          'Master The French Defense Update 1.pgn',
          'Master the French Defense.pgn',
          'Masterclass. Improve your Defence # Davorin Kuljasevic, Grigor Grigorov & Petar G. Arnaudov # Modern Chess # 2021.pgn',
          'Mastering Opening Strategy.pgn',
          'Mastering Ruy Lopez Pawn Structures Part 1.pgn',
          'Mastering Ruy Lopez Pawn Structures Part 2.pgn',
          'Mastering the Maroczy Bind. Strategic Foundations & Deep Plans.pgn',
          'Max Attack! The Max Lange Gambit.pgn',
          'Mayhem in the Scotch.pgn',
          'Meet 1.Nf3 with 1...d5. Complete Repertoire against 2.b3 2.c4 2.g3.pgn',
          'Modern Pirc Alekhine Philidor Scandinavian & Sidelines Expert Repertoire for White # Kalyan Arjun # Modern Chess # 2023.pgn',
          'Modern Repertoire against the Benko Gambit.pgn',
          'Modern Repertoire against the Catalan.pgn',
          'Modern Repertoire against the Italian Game.pgn',
          'Modern Scheveningen Sicilian.pgn',
          'Moscow Variation against the Sicilian. Complete Repertoire against 2...d6 # Arturs Neiksans # Modern Chess # 2018.pgn',
          'Moscow Variation Top-Level Repertoire for White Part 1.pgn',
          'Moscow Variation Top-Level Repertoire for White Part 2.pgn',
          'Must-Know Strategies in the Nimzo-Indian Defense.pgn',
          'Must-Know Structures for 1.d4 Players Part 1.pgn',
          'My Caro-Kann Part 1.pgn',
          'My Caro-Kann Part 2.pgn',
          'My Caro-Kann Part 3.pgn',
          'My Caro-Kann Part 4.pgn',
          'My Catalan Complete Guide for White.pgn',
          'My Dutch.pgn',
          'My First Chess Opening Repertoire for White.pgn',
          'My First Gruenfeld Opening Repertoire.pgn',
          'My First Opening Repertoire. 1. d4.pgn',
          'My First Opening Repertoire. Scandinavian Defense.pgn',
          'My First Opening Repertoire.pgn',
          'My Italian Part 1.pgn',
          'My Nimzo-Indian.pgn',
          'My Practical Spanish Repertoire for White.pgn',
          'My Queen\'s Gambit Declined.pgn',
          'My Repertoire against 1.Nf3 & 1.c4.pgn',
          'My Secret Sveshnikov. The Sicilian by A Sicilian.pgn',
          'My Solution to the Reti Opening.pgn',
          'Najdorf Sicilian.pgn',
          'Nakamura\'s Conquest. King\'s Indian Defense.pgn',
          'Navigating the Ruy Lopez Vol 1.pgn',
          'Navigating the Ruy Lopez Vol 2.pgn',
          'Navigating the Ruy Lopez Vol 3.pgn',
          'Neo-Catalan Accepted.pgn',
          'Neo-Catalan Declined.pgn',
          'Neutralizing The Closed Sicilian.pgn',
          'Nimzo-Indian Defence Top-Level Repertoire for Black Part 1.pgn',
          'Nimzo-Indian Defence Top-Level Repertoire for Black Part 2.pgn',
          'Nimzo-Indian Defence. Complete Repertoire for Black.pgn',
          'Nimzo-Indian Defense. Tournament Edition.pgn',
          'Noteboom. Complete Repertoire for Black.pgn',
          'On the way to the Queen\'s Gambit Declined.pgn',
          'Op. Trends in Sic., Caro., Phil., Scand., Pirc and Alek. - Batumi Olymp. #Modern Chess.pgn',
          'Opening Compass for Black & White.pgn',
          'Opening Trends in 1.e4 e5 & 1.e4 e6. Batumi Olympiad.pgn',
          'Openings Oddities  - Bryan Tillis (2021 updated).pgn',
          'Openings Oddities.pgn',
          'Outfox the French. The Horwitz Attack for White.pgn',
          'Petroff Defense According to Cheparinov.pgn',
          'Petroff Defense. Cochrane Gambit.pgn',
          'Petrosian System. Complete Repertoire against Queen s Indian Defence.pgn',
          'Philidor According to Cheparinov.pgn',
          'Philidor Defence. Play the Antoshin Variation.pgn',
          'Philidor Defense.pgn',
          'Pirc simplified.pgn',
          'Play 5.Bd2 against the Gruenfeld.pgn',
          'Play Queen\'s Gambit Declined against 1.d4 Nf6 2.c4 e6 3.Nf3 Part 1.pgn',
          'Play the Alapin Part 2.pgn',
          'Play the Bayonet Attack against the Kings Indian Defence.pgn',
          'Play the Benko. Complete Repertoire for Black.pgn',
          'Play the Berlin against Ruy Lopez Part 1.pgn',
          'Play the Berlin against Ruy Lopez Part 2.pgn',
          'Play the Bogo-Indian Defence Part 2.pgn',
          'Play the Caro-Kann Part 1.pgn',
          'Play the Caro-Kann Part 2.pgn',
          'Play the Catalan. Complete Repertoire for White Part 1.pgn',
          'Play the Catalan. Complete Repertoire for White Part 2.pgn',
          'Play the Catalan. Complete Repertoire for White Part 3.pgn',
          'Play the Classical Sicilian. Complete Repertoire.pgn',
          'Play the Dubov Tarrasch.pgn',
          'Play the Four Knights. Practical Repertoire for White.pgn',
          'Play the Gruenfeld Defence Part 1.pgn',
          'Play the Gruenfeld Defence Part 2.pgn',
          'Play the Kan Sicilian. Complete Repertoire for Black.pgn',
          'Play the Leningrad Bird September 2019.pgn',
          'Play the London System.pgn',
          'Play the Makagonov against King s Indian Defence.pgn',
          'Play the Moscow Variation.pgn',
          'Play the Najdorf Top-Level Repertoire Part 1.pgn',
          'Play the Najdorf Top-Level Repertoire Part 2.pgn',
          'Play the Neo-Seirawan System against King\'s Indian Defence.pgn',
          'Play the Open Sicilian Part 1.pgn',
          'Play the Open Sicilian Part 2.pgn',
          'Play the Open Sicilian Part 3.pgn',
          'Play the Open Spanish. Repertoire for Black.pgn',
          'Play the Owen Defense against 1.c4.pgn',
          'Play the Philidor Defence.pgn',
          'Play the Queen\'s Gambit Exchange Variation Part 1.pgn',
          'Play the Queen\'s Gambit Exchange Variation Part 2.pgn',
          'Play the Reti Part 1.pgn',
          'Play the Reti Part 2.pgn',
          'Play the Ruy Lopez Part 1.pgn',
          'Play the Ruy Lopez Part 2.pgn',
          'Play the Scheveningen via Paulsen.pgn',
          'Play the Sicilian Alapin Part 1.pgn',
          'Play the Sicilian Four Knights.pgn',
          'Play the Spanish Four Knights.pgn',
          'Play the Spanish. Top-Level Repertoire for White Part 1 # Baadur Jobava & Pier Luigi Basso # Modern Chess # 2024.pgn',
          'Play the Spanish. Top-Level Repertoire for White Part 2 # Baadur Jobava & Pier Luigi Basso # Modern Chess # 2024.pgn',
          'Play the Sveshnikov Sicilian Full Repertoire after 1.e4 c5 2.Nf3 #Ivan cheparinov #Modern Chess.pgn',
          'Play the Taimanov Sicilian.pgn',
          'Positional Gruenfeld Repertoire Part 1.pgn',
          'Positional Gruenfeld Repertoire Part 2.pgn',
          'Positional Gruenfeld Repertoire Part 3.pgn',
          'Positional Nimzo-Indian Repertoire Part 1.pgn',
          'Positional Nimzo-Indian Repertoire Part 2.pgn',
          'Positional Repertoire against Nimzo-Indian Defence.pgn',
          'Positional Repertoire against the Caro-Kann (1).pgn',
          'Positional Repertoire against the Caro-Kann.pgn',
          'Positional Repertoire Against The French.pgn',
          'Positional Repertoire against the Slav Defence.pgn',
          'Practical 1.d4 Repertoire for White Part 1.pgn',
          'Practical 1.d4 Repertoire for White Part 2.pgn',
          'Practical 1.e4 Repertoire for White.pgn',
          'Practical Nimzo-indian Repertoire.pgn',
          'Practical Repertoire against 1.c4 & 1.Nf3.pgn',
          'Practical Repertoire against Pirc & Modern Defence.pgn',
          'Practical Repertoire against Ruy Lopez.pgn',
          'Practical Repertoire against the Nimzo-Indian Defence.pgn',
          'Pseudo Trompowsky.pgn',
          'Queen s Gambit Declined for Black Part 1.pgn',
          'Queen s Gambit Declined for Black Part 2.pgn',
          'Queen\'s Gambit Accepted simplified.pgn',
          'Queen\'s Gambit Accepted. Complete Repertoire for Black.pgn',
          'Queen\'s Gambit Accepted. Grind for the Win.pgn',
          'Queen\'s Gambit Accepted. Simple Solution to 1.d4.pgn',
          'Queen\'s Gambit Accepted. Top-Level Repertoire for Black.pgn',
          'Queen\'s Gambit Declined According to Cheparinov Part 1.pgn',
          'Queen\'s Gambit Declined. A Grandmaster Explains.pgn',
          'Queen\'s Gambit with ...h7-h6 Universal Repertoire against 1.d4 1.Nf3 & 1.c4 # Ioannis Papaioannou # Modern Chess # 2023.pgn',
          'Queen\'s Indian Defense. Tournament Edition.pgn',
          'Rapid & Blitz 1.e4 Repertoire.pgn',
          'Rapport-Jobava System.pgn',
          'Ratsma\'s Complete Black & White Repertoire.pgn',
          'Reign Supreme. The King\'s Indian Attack.pgn',
          'Relentless Reti for Casual Players.pgn',
          'Repertoire against Reti Opening King\'s Indian Attack & English Opening.pgn',
          'Repertoire Against The Catalan.pgn',
          'Repertoire Against The Kings Indian Defence.pgn',
          'Repertoire against the Slav Part 1.pgn',
          'Repertoire against the Slav Part 2. Fight the Semi-Slav.pgn',
          'Repertoire against the Slav Part 3. Squeeze the Chebanenko Slav.pgn',
          'Reti Accepted.pgn',
          'Reti Opening Pawn Structures Strategy Tactical.pgn',
          'Reti Opening- Advance Variation.pgn',
          'Reti Opening- Main Variation, 4...Bf5.pgn',
          'Reti Opening- Main Variation, 4...Bg4.pgn',
          'Reti Opening- Main Variation, 4...dxc4.pgn',
          'Reti Opening- Main Variation, 4...g6.pgn',
          'Reti Opening- Other Lines 1.pgn',
          'Reti Opening- Other Lines 2.pgn',
          'Reti Opening. Repertoire against the King\'s Indian Setups.pgn',
          'Reti Opening. Repertoire for White after 1.Nf3 d5 2.e3.pgn',
          'Reversed Sicilian. Avrukh s Antidote to 1.c4 Part 1.pgn',
          'Reversed Sicilian. Avrukh s Antidote to 1.c4 Part 2.pgn',
          'Romanishin Variation against Nimzo-Indian.pgn',
          'Rossolimo Variation against the Sicilian. Complete Repertoire against 2...Nc6 # Neiksans Arturs # Modern Chess # 2018.pgn',
          'Ruy Lopez common lines.pgn',
          'Ruy Lopez. Masterclass Edition.pgn',
          'Sabotage the Slav.pgn',
          'Scandinavian Defense (2).pgn',
          'Scandinavian Defense.pgn',
          'Scotch Gambit for White. Top-Level Repertoire.pgn',
          'Scotch Game. Expert Repertoire for White.pgn',
          'Scotch Repertoire for Black.pgn',
          'Seal the Deal. How to Gain & Convert Middlegame Advantages # Sam Shankland & Dalton Perrine # Chessable # 2025.pgn',
          'Secret Blitz Weapons. 1.e4.pgn',
          'Secret Blitz Weapons. Alekhine Defense.pgn',
          'Secret Blitz Weapons. The Damiano Petroff.pgn',
          'Semi-Slav (2020).pgn',
          'Semi-Slav Defence. Top-Level Repertoire for Black.pgn',
          'Semi-Tarrasch. The Berlin of 1.d4.pgn',
          'September-Workshop-Catalan-Opening.pgn',
          'Seriously Shock the Semi-Slav.pgn',
          'Short & Sweet Pirc Defense.pgn',
          'Short & Sweet. Gustafsson\'s 1.e4 e5.pgn',
          'Short & Sweet. The Italian Game.pgn',
          'Short & Sweet. The London System.pgn',
          'Short & Sweet. The Nimzo-Indian.pgn',
          'Short & Sweet. The Ragozin.pgn',
          'Short & Sweet. The Ruy Lopez.pgn',
          'Short & Sweet. The Scotch Game.pgn',
          'Short & Sweet. The Slav.pgn',
          'Short & Sweet. The Taimanov Sicilian.pgn',
          'Sicilian Defence. Repertoire against White\'s Sidelines after 1.e4 c5 2.Nf3 d6 # Efimenko Zahar # Modern Chess # 2020.pgn',
          'Sicilian Four Knights Top Level Repertoire for Black.pgn',
          'Sicilian Kan. Repertoire for Black.pgn',
          'Sicilian Rossolimo for white.pgn',
          'Sicilian Sacrifices. 20 annotated games.pgn',
          'Slav Setups against English Reti & Larsen.pgn',
          'Slav.pgn',
          'Smithy\'s Opening Fundamentals.pgn',
          'Solid Repertoire against 1.d4. Slav Defence Part 1.pgn',
          'Solid Repertoire against 1.d4. Slav Defence Part 2.pgn',
          'Solid Repertoire against 1.d4. Slav Defence Part 3.pgn',
          'Solid Repertoire against the Caro-Kann.pgn',
          'Starting Out. 1.e4 e5.pgn',
          'Starting Out. Caro-Kann.pgn',
          'Starting Out. Nimzo-Indian Defense.pgn',
          'Starting Out. The Scotch.pgn',
          'Starting Out. The Sicilian.pgn',
          'Stonewall Middlegames.pgn',
          'Strategic Repertoire Against Gruenfeld Defence.pgn',
          'Strategic Repertoire against the Sicilian Defence. 1.e4 c5 2.Nf3 d6 3.Bb5+ # Ioannis Papaioannou # Modern Chess # 2024.pgn',
          'Strategic Repertoire against the Sicilian Defence. Play the Rossolimo # Ioannis Papaioannou # Modern Chess # 2024.pgn',
          'Strategical Repertoire against King\'s Indian Defense.pgn',
          'Super Grandmaster Strategy. Leko\'s Ruy Lopez.pgn',
          'Surprise Attack. The Belgrade Gambit.pgn',
          'Surviving the Halloween Gambit.pgn',
          'Symmetrical English - Vigorito.pgn',
          'Symmetrical English. Complete Repertoire for Black.pgn',
          'Symmetrical English. Complete Repertoire for White.pgn',
          'Symmetrical English.pgn',
          'Tackle the French with 3. Bd3.pgn',
          'Taimanov Attack against the Modern Benoni.pgn',
          'Taimanov Sicilian.pgn',
          'Take Down the French. French Tarrasch Variation.pgn',
          'Take Down the Nimzo-Indian.pgn',
          'Tame the Sicilian. The Alapin Variation.pgn',
          'Taming the Tennison Gambit.pgn',
          'The Accelerated Queen\'s Indian Defense. A full repertoire against 1.d4 1.c4 & 1.Nf3 # Krykun Yuriy # Chessable # 2020.pgn',
          'The Accelerated Rossolimo.pgn',
          'The Active Bogo-Indian.pgn',
          'The Aggressive Czech Benoni.pgn',
          'The Aggressive Queen\'s Gambit Declined.pgn',
          'The Agile London System.pgn',
          'The Alekhine Defense.pgn',
          'The Anti-Sicilian toolkit.pgn',
          'The Anti-Sicilians - Short and Sweet.pgn',
          'The Battle-Tested Scandinavian Defense.pgn',
          'The Beginners Black Repertoire.pgn',
          'The Beginner\'s 1.e4 Repertoire.pgn',
          'The Benko Blueprint. From Theory to Practice.pgn',
          'The Berlin Simplified.pgn',
          'The Bishop\'s Opening.pgn',
          'The Caro-Kann for Club Players.pgn',
          'The Caro-Kann Simplified.pgn',
          'The Caro-Kann Starter Kit.pgn',
          'The Classical Bird for Club Players.pgn',
          'The Classical English.pgn',
          'The Classy Semi-Tarrasch Defense.pgn',
          'The Complete Open Spanish for Black.pgn',
          'The Complete Scotch.pgn',
          'The Cowboy Attack 2.b3 Sicilian.pgn',
          'The Dragon Sicilian. Wing Attack.pgn',
          'The Dutch.pgn',
          'The Dynamic Italian game.pgn',
          'The Easiest Semi-Slav Defense.pgn',
          'The Energetic 1.e4 Part 1.pgn',
          'The Fast and Furious Scotch Gambit.pgn',
          'The Fearsome Budapest Gambit.pgn',
          'The Fierce Nimzo-Indian.pgn',
          'The Fierce Vienna Catalan & Sidelines.pgn',
          'The Fighting King\'s Indian Defense.pgn',
          'The Fighting Sicilian. A complete repertoire vs 1.e4.pgn',
          'The French Defense (1).pgn',
          'The French Defense.pgn',
          'The French Tarrasch. Masterclass Edition.pgn',
          'The Furious Panov-Botvinnik.pgn',
          'The GothamChess 1.e4 Repertoire.pgn',
          'The Grand Ruy Lopez.pgn',
          'The Grand Toolbox Fighting Flank Openings.pgn',
          'The Gruenfeld According to Svidler.pgn',
          'The Gruenfeld Revisited.pgn',
          'The Gruenfeld Supercharged!.pgn',
          'The Harmonious French Tarrasch.pgn',
          'The Harry Attack. Stonewall Attack for White.pgn',
          'The Henley Files Volume 1. The French Rubinstein.pgn',
          'The Henley Files Volume 3. The London System.pgn',
          'The High Pressure Alapin Sicilian (update1).pgn',
          'The Hybrid Gruenfeld-Slav.pgn',
          'The Hyper Accelerated Dragon. A Full Repertoire for Black.pgn',
          'The Jobava London System (2).pgn',
          'The Jobava London System.pgn',
          'The Killer Barry Attack.pgn',
          'The Killer Colle-Zukertort System.pgn',
          'The Killer Dutch Rebooted.pgn',
          'The Killer Loewenthal Sicilian.pgn',
          'The King\'s Indian Attack.pgn',
          'The King\'s Indian Attacking Manual.pgn',
          'The King\'s Indian Defense Simplified.pgn',
          'The King\'s Indian in thirty classic games.pgn',
          'The King\'s Indian Simplified.pgn',
          'The London Attack. An Ambitious Repertoire.pgn',
          'The London System. Essential Theory.pgn',
          'The Magnus Queen\'s Gambit.pgn',
          'The Magnus Sicilian.pgn',
          'The Maximized Von Hennig Schara Gambit.pgn',
          'The Mighty Queen\'s Indian Defense.pgn',
          'The Modern Makagonov. Complete Repertoire against King\'s Indian Defence # Kuljasevic Davorin # Modern Chess # 2019.pgn',
          'The Modernized Colle-Zukertort Attack.pgn',
          'The Najdorf Sicilian simplified.pgn',
          'The Najdorf.pgn',
          'The Nakhmanson Gambit.pgn',
          'The Nimzo-Indian.pgn',
          'The Notorious Nimzo Sicilian.pgn',
          'The Open Sicilian. A Champion\'s Guide.pgn',
          'The Open Sicilian. Masterclass Edition.pgn',
          'The Patient Closed Sicilian.pgn',
          'The Petroff.pgn',
          'The Practical Philidor. A Complete Fighting Repertoire.pgn',
          'The Ragozin.pgn',
          'The Razor Sharp Rauzer Sicilian.pgn',
          'The Refined Ragozin.pgn',
          'The Reti. Nimzo-Larsen Attack.pgn',
          'The Reti.pgn',
          'The Revamped Nimzo-Indian for Black Krishnater.pgn',
          'The Romantic Italian.pgn',
          'The Ruy Lopez Rebooted. BrightestNight.pgn',
          'The Scandinavian Supercharged.pgn',
          'The Scotch Gambit Starter Kit.pgn',
          'The Semi-Slav Defense. Masterclass Edition.pgn',
          'The Shirov Gambit Break Down the Philidor Defense.pgn',
          'The Sicilian Dragon.pgn',
          'The simplest Scandinavian.pgn',
          'The Smart Ruy Lopez Part 1. Exchange Variation.pgn',
          'The Smart Ruy Lopez Part 2. Break Down the Berlin Defense.pgn',
          'The Smyslov Ruy Lopez.pgn',
          'The Solid Queen\'s Gambit Declined.pgn',
          'The Strategy Instructors Volume 1. Pawn Majority & Minority # Ramesh R.B. & Efstratios Grivas # Chessable  # 2024.pgn',
          'The Strategy Instructors Volume 3. The Exchange Sacrifice # Ramesh R.B. & Efstratios Grivas # Chessable  # 2025.pgn',
          'The Supercharged Milner-Barry Gambit.pgn',
          'The Thrilling Jaenisch Gambit.pgn',
          'The Trompowsky Simplified.pgn',
          'The Unbreakable Petroff Caruana\'s complete repertoire against 1. e4.pgn',
          'The Unexplored 1.d4 Nf6 2.c4 e6 3.Bg5.pgn',
          'The Unexplored Schlechter Slav.pgn',
          'The Venomous Four Knights Sicilian.pgn',
          'The Vienna Game.pgn',
          'The Vigorous Wormald Attack. A Practical White Repertoire vs. 1.e4 e5.pgn',
          'The Viktorious Kan Sicilian.pgn',
          'The Wild Wild Benoni.pgn',
          'The Yaac Attack. Stonewall Attack for White.pgn',
          'Thematic Tactics Caro-Kann.pgn',
          'Thematic Tactics Najdorf Sicilian.pgn',
          'Thematic Tactics. Alekhine Defense.pgn',
          'Thematic Tactics. Benko Gambit.pgn',
          'Thematic Tactics. Sveshnikov Sicilian.pgn',
          'Thematic Tactics. The London System.pgn',
          'Too Hot To Handle. The King\'s Indian Defense.pgn',
          'Top Level Catalan Repertoire for White Part 1.pgn',
          'Top Level Catalan Repertoire for White Part 2.pgn',
          'Top Level Repertoire against Queen\'s Gambit Declined Part 1.pgn',
          'Top Level Repertoire against Queen\'s Gambit Declined Part 2.pgn',
          'Top Level Repertoire against the Slav Defence.pgn',
          'Top-Level Repertoire against French & Caro-Kann.pgn',
          'Top-Level Repertoire against the Catalan Opening.pgn',
          'Top-Level Repertoire against the Scandinavian Defence.pgn',
          'Top-Level Repertoire against the Sicilian Part 1.pgn',
          'Top-Level Repertoire against the Sicilian Part 2.pgn',
          'Torre Attack.pgn',
          'Tournament Ready. The Opening.pgn',
          'Tournament-Ready. Taimanov Sicilian.pgn',
          'Trample the French. French Tarrasch Variation.pgn',
          'Trappy Repertoire for Black against 1.e4 & 1.d4.pgn',
          'Tricky Repertoire against King\'s Indian Defence.pgn',
          'Tricky Repertoire against the Italian.pgn',
          'Trompowsky Attack- Raptor Variation, 3... c5.pgn',
          'Trompowsky Attack- Raptor Variation, 3...d5.pgn',
          'Trompowsky Attack- Raptor Variation, Other moves.pgn',
          'Trompowsky Tactics.pgn',
          'Unbalanced. The French Exchange for Black.pgn',
          'Understand the Bogo-Indian.pgn',
          'Understand the Classical Sicilian.pgn',
          'Understand the French Defence.pgn',
          'Understand the Hedgehog.pgn',
          'Understand the King\'s Indian. Typical Middlegame Ideas.pgn',
          'Understand the Maroczy Bind.pgn',
          'Understand the Modern Benoni.pgn',
          'Understand the Najdorf. Aggressive Systems.pgn',
          'Understand the Najdorf. Positional Systems.pgn',
          'Understand the Nimzo Indian.pgn',
          'Understand the Queen\'s Indian Defence.pgn',
          'Understand the Reversed Sicilian. 1.c4 e5.pgn',
          'Understand the Ruy Lopez (1).pgn',
          'Understand the Ruy Lopez.pgn',
          'Understand the Scandinavian.pgn',
          'Understand the Scotch Game.pgn',
          'Understand the Sicilian. 20 Must-Know Concepts.pgn',
          'Understand the Slav Defence.pgn',
          'Understand the Sveshnikov Sicilian.pgn',
          'Understand the Trompowsky -Typical Pawn Structures & Theoretical Trends.pgn',
          'Understanding Before Moving 2. Queen\'s Gambit Structures.pgn',
          'Understanding Before Moving 3. Sicilian Structures Part 1. Najdorf & Scheveningen # Herman Grooten # Chessable # 2020.pgn',
          'Understanding Chess Openings. 1.e4 Part 1.pgn',
          'Understanding Chess Openings. 1.e4 Part 2.pgn',
          'Understanding Chess Openings. 1.e4 Part 3.pgn',
          'Universal Solution against Philidor Modern & Pirc.pgn',
          'Unleash the Bull. 1...e5. A Full Repertoire for Black.pgn',
          'Vaporize the Caro-Kann. Alien Gambit.pgn',
          'Vienna Game. Frankenstein-Dracula Variation.pgn',
          'Winning Chess Openings.pgn',
          'Winning with 1.e4. The Ultimate Repertoire for Beginners.pgn',
          'Yates Variation & Anti-Marshall. Repertoire for White.pgn',
          'Zap! Tactics in the Slav.pgn'
        ];
        setPgnFiles(files);
      } catch (error) {
        console.error('Failed to load PGN files:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadPgnFiles();
  }, []);

  const normalizeSearchText = (value: string) =>
    value
      .toLowerCase()
      .replace(/\.pgn$/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

  const normalizedQuery = normalizeSearchText(searchQuery);
  const queryTokens = normalizedQuery ? normalizedQuery.split(' ') : [];

  const filteredPgnFiles = queryTokens.length > 0
    ? pgnFiles.filter((fileName) => {
        const normalizedFile = normalizeSearchText(fileName);
        return queryTokens.every((token) => normalizedFile.includes(token));
      })
    : pgnFiles;

  const handleGamesLoaded = async (loadedGames: Game[], fileName?: string) => {
    setIsLoading(true);
    
    const scopedGames = fileName ? scopeGamesForFile(fileName, loadedGames) : loadedGames;
    
    // Store games in context with filename (this triggers localStorage save with PGN name)
    setGames(loadedGames, fileName);
    
    // Select first game
    if (scopedGames.length > 0) {
      setSelectedGame(scopedGames[0]);
      
      // Wait longer to ensure state is fully persisted to localStorage and context is updated
      setTimeout(() => {
        router.push(`/training?game=${encodeURIComponent(scopedGames[0].id)}`);
      }, 200);
    } else {
      setIsLoading(false);
    }
  };

  const handleResumeGame = () => {
    if (games.length > 0) {
      setSelectedGame(games[0]);
      router.push(`/training?game=${encodeURIComponent(games[0].id)}`);
    }
  };

  const handleUploadNew = () => {
    clearGameData();
    setIsLoading(false);
  };

  const handleSelectPgnFile = async (fileName: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/pgn/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }
      
      const content = await response.text();
      const { parsePGN } = await import('@/lib/pgn-parser');
      const loadedGames = parsePGN(content);
      
      if (loadedGames.length === 0) {
        throw new Error('No valid games found in the selected file');
      }
      
      // Call the same handler as file upload
      handleGamesLoaded(loadedGames, fileName);
    } catch (error) {
      console.error('Error loading PGN file:', error);
      alert(`Failed to load ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const totalMoves = games.reduce((sum, g) => sum + g.moves.length, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100" />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {isGuest && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Guest Mode</span>
            </div>
            <p className="text-sm text-amber-300 mt-1">
              Your progress will be saved locally. Create an account to save progress permanently.
            </p>
          </div>
        )}
        <div className="space-y-8">
          {/* Header */}
          <header className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Chess Opening Trainer</h1>
                <p className="text-sm text-gray-500">Master openings with interactive training</p>
              </div>
            </div>
          </header>

          {/* Resume or Upload Decision */}
          {games.length > 0 && (
            <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">You have an existing game</h2>
                <p className="text-sm text-gray-400">
                  {games[0]?.pgn?.split('\n')[0] || 'Game'} • {totalMoves} moves
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResumeGame}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Play className="w-4 h-4" />
                  Resume Game
                </button>
                
                <button
                  onClick={handleUploadNew}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium"
                >
                  <UploadIcon className="w-4 h-4" />
                  New Game
                </button>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div className="max-w-md mx-auto pt-12">
            <PGNUpload onGamesLoaded={handleGamesLoaded} isLoading={isLoading} />
          </div>

          {/* Select Games Section */}
          <div className="max-w-md mx-auto pt-6">
            <div className="text-center">
              <Button
                onClick={() => setShowSelectGames(!showSelectGames)}
                disabled={isLoading}
                variant="outline"
                className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-300 hover:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Select Games
                {showSelectGames ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {showSelectGames && (
              <Card className="mt-4 p-4 bg-gray-900/80 border-gray-800 backdrop-blur-sm">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white text-center">Choose a PGN File</h3>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by opening name, variation, or move"
                      className="w-full rounded-lg border border-gray-700 bg-gray-950/80 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {loadingFiles ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                      <p className="text-sm text-gray-400 mt-2">Loading files...</p>
                    </div>
                  ) : filteredPgnFiles.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm font-medium text-white">No PGN files match your search</p>
                      <p className="mt-1 text-xs text-gray-400">Try a different opening, variation, or move sequence.</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredPgnFiles.map((fileName, index) => (
                        <button
                          key={`${fileName}-${index}`}
                          onClick={() => handleSelectPgnFile(fileName)}
                          disabled={isLoading}
                          className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate">
                                {fileName.replace('.pgn', '')}
                              </p>
                              <p className="text-xs text-gray-400">PGN File</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
