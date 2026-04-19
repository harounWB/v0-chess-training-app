import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'About OpeningMaster',
  description: 'Learn what OpeningMaster does, how it helps chess players train openings, and what parts of the site are available today.',
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">About Us</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">About OpeningMaster</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-300">
            OpeningMaster is a chess opening trainer built for players who want a faster way to study openings, review PGN files, and turn real games into practical training.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
              <h2 className="text-xl font-semibold text-white">What the website does</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-400">
                <li>Upload PGN files or choose from the built-in opening library.</li>
                <li>Parse games into training lines and review them move by move.</li>
                <li>Practice openings interactively in training mode.</li>
                <li>Track progress locally and through account-backed storage where available.</li>
                <li>Organize repertoires into collections and revisit them from the dashboard.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-gray-800 bg-gray-950/70 p-6">
              <h2 className="text-xl font-semibold text-white">Why it exists</h2>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                Many players study openings in a scattered way. OpeningMaster keeps the workflow simple: analyze a game, train the line, and return later to continue from where you stopped.
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                The goal is not to overload you with theory. The goal is to help you build reliable memory, better habits, and a clearer understanding of the positions you actually reach.
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/upload" className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700">
              Go to PGN Analyzer
            </Link>
            <Link href="/training" className="rounded-full border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-gray-800">
              Open Training Mode
            </Link>
            <Link href="/support" className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20">
              Support the Project
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

