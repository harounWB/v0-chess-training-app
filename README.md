# Openingmaster

Openingmaster is a chess opening training website built with Next.js. It helps players import PGN files, study opening repertoires, and practice them through interactive board training, progress tracking, and engine-assisted feedback.

## What The Website Does

- Upload PGN files or pick from the included opening repertoires.
- Parse the games and turn them into structured training lines.
- Practice openings move by move in `train` mode.
- Switch to `explore` mode to browse the full game and annotations more freely.
- Track progress per PGN file, including explored and trained chapters.
- Resume saved work from local storage or Supabase-backed account data.
- Organize repertoires into custom collections.
- Adjust board themes, piece styles, sound, animations, reminders, and blitz settings.
- Use Lichess cloud evaluation to suggest best moves during practice positions.

## Main Sections

- `/upload` - import a PGN file or choose from the built-in library.
- `/training` - train against the selected repertoire.
- `/dashboard` - view overall progress and continue where you left off.
- `/practice` - practice chess positions against the engine.
- `/settings` - customize board appearance and training behavior.
- `/support` - project and community support information.

## How It Works

1. A PGN file is uploaded or selected from the built-in repertoire list.
2. The app parses the PGN into individual games and move trees.
3. The selected game is stored in shared game context.
4. The trainer board walks through the opening line, checks your moves, and updates progress.
5. Depending on your settings, the app can save locally for guest users or sync authenticated progress through Supabase.

## AI In The Project

This website was also made with AI-assisted development.

- AI helped accelerate the coding workflow, structure pages, and organize reusable components.
- The chess experience includes engine-backed move analysis through the Lichess cloud evaluation endpoint.
- AI was used as a development partner to help document, refine, and iterate on the product faster.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- chess.js
- react-chessboard
- Stockfish
- Lichess cloud evaluation

## Project Structure

- `app/` - app routes, pages, and API endpoints.
- `components/` - UI and trainer components.
- `hooks/` - reusable React hooks.
- `lib/` - chess logic, parsing, types, and app context.
- `supabase/` - database migrations.
- `public/` - PGN assets, board pieces, and static images.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Notes

- Guest progress is stored locally in the browser.
- Signed-in users can persist progress through Supabase.
- The built-in PGN library is large and focused on chess opening repertoires.

