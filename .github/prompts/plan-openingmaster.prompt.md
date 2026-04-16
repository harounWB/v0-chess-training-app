This is a Next.js-based chess opening trainer application called "Openingmaster," built with TypeScript, React, and Tailwind CSS. It allows users to upload PGN files, train on openings, explore games, and track progress. Below is a high-level overview of the key parts of the codebase.

### Project Structure
- **Root Configuration**: Uses Next.js for routing and building. [`package.json`](package.json ) defines dependencies like [`chess.js`](components/ChessBoard.tsx ) for game logic, `@radix-ui` for UI components, and `recharts` for charts. [`next.config.mjs`](next.config.mjs ) configures TypeScript and image handling.
- **App Directory**: Contains pages like the main page.tsx and support page support/page.tsx. layout.tsx wraps the app with providers like [`GameProvider`](app/layout.tsx ) for state management.
- **Components**: Core UI and logic components in [`components`](components ).
  - [`ChessBoard`](components/ChessBoard.tsx ): Renders the chessboard, handles moves, and supports training hints.
  - [`Trainer`](components/Trainer.tsx ): Main training interface, managing game playback, modes (train/explore), and user interactions.
  - [`TrainingPanel`](components/TrainingPanel.tsx ): Controls training settings like difficulty and feedback.
  - [`MovesPanel`](components/MovesPanel.tsx ): Displays move history and navigation.
  - [`GameList`](components/GameList.tsx ): Lists uploaded games for selection.
  - [`SessionFeedback`](components/SessionFeedback.tsx ): Shows training session stats.
  - [`PlaybackControls`](components/PlaybackControls.tsx ): Handles game playback speed and controls.
- **UI Components**: Reusable shadcn/ui components in [`components/ui`](components/ui ), e.g., [`ChartContainer`](components/ui/chart.tsx ) for data visualization, [`Carousel`](components/ui/carousel.tsx ) for sliding content, and [`Sidebar`](components/ui/sidebar.tsx ) for navigation.
- **Hooks and Utils**: Custom hooks like [`useChessSound`](hooks/useChessSound.ts ) for audio feedback. [`lib`](lib ) includes types, context (e.g., [`GameProvider`](lib/GameContext.tsx )), and utilities.
- **Styling**: [`postcss.config.mjs`](postcss.config.mjs ) configures Tailwind. [`app/globals.css`](app/globals.css ) defines global styles.

### Key Features
- **Training Modes**: Switch between "train" (interactive practice) and "explore" (free navigation). Uses [`chess.js`](components/ChessBoard.tsx ) for move validation and FEN position tracking.
- **Game Management**: Upload PGNs via [`PGNUpload`](components/PGNUpload.tsx ), parse moves, and store in context.
- **Audio and Feedback**: Plays sounds on moves via [`useChessSound`](hooks/useChessSound.ts ). Tracks attempts and provides hints.
- **Charts**: Likely used for progress visualization in training sessions, powered by Recharts in [`chart.tsx`](components/ui/chart.tsx ).
- **Support Page**: Displays crypto donation info with QR codes, as seen in support/page.tsx.

For deeper dives, open specific files like [`components/Trainer.tsx`](components/Trainer.tsx ) to see state management or [`components/ChessBoard.tsx`](components/ChessBoard.tsx ) for board rendering logic. If you have a specific part to focus on, provide more details!
