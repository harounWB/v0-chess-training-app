import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
    <main className="relative min-h-screen overflow-hidden bg-[#060b14] text-gray-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.15]"
      />
      <Header />
      <div className="relative mx-auto max-w-screen-xl px-4 py-10 sm:py-14 lg:py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-2xl shadow-black/20 backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_34%)]"
          />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Opening-Specific Pages</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Make a page for each opening
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-300">
              These pages give each major opening a dedicated home so players can search, study, and revisit the ideas that matter most.
            </p>
          </div>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {openingPages.map((opening) => (
            <Link
              key={opening.slug}
              href="/upload"
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.07] hover:shadow-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b14]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 opacity-70"
              />
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">{opening.title}</h2>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-400">{opening.description}</p>
              <div className="mt-auto flex items-center gap-3 pt-6">
                <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/50 via-cyan-400/0 to-transparent" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Click to train this opening</p>
              </div>
            </Link>
          ))}
        </div>

        <OpeningPgnBrowser fileNames={pgnFiles} />
      </div>
    </main>
  );
}
