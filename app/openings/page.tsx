import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { OpeningPgnBrowser } from '@/components/OpeningPgnBrowser';
import { openingPages } from '@/lib/seo';
import pgnFiles from '@/lib/pgn-files.json';

export const metadata: Metadata = {
  title: 'Chess Opening Guides',
  description: 'Opening-specific chess pages for the Sicilian Defense, French Defense, Caro-Kann, King\'s Indian Defense, and Queen\'s Gambit.',
};

export default function OpeningsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Opening-Specific Pages</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Make a page for each opening</h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            These pages give each major opening a dedicated home so players can search, study, and revisit the ideas that matter most.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {openingPages.map((opening) => (
            <Link
              key={opening.slug}
              href="/upload"
              className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 transition-transform hover:-translate-y-1 hover:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-white">{opening.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">{opening.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan-300">Click to train this opening</p>
            </Link>
          ))}
        </div>

        <OpeningPgnBrowser fileNames={pgnFiles} />
      </div>
    </main>
  );
}
