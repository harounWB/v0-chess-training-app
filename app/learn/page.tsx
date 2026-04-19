import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { learningTopics } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Chess Learning Hub',
  description: 'Beginner-friendly chess learning pages covering opening study, game analysis, and improvement habits.',
};

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Learning / Blog</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">How to Learn Chess Openings Fast</h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            These beginner-focused topics are designed to help players study openings more efficiently, review mistakes, and improve their rating with a clear plan.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {learningTopics.map((topic) => (
            <article key={topic.title} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">{topic.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">{topic.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-gray-800 bg-gray-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">Study flow that works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 text-sm leading-6 text-gray-400">
              Start with a model game or a specific PGN line and learn the opening ideas before memorizing the details.
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 text-sm leading-6 text-gray-400">
              Review your own mistakes immediately so the next repetition has context and not just raw theory.
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 text-sm leading-6 text-gray-400">
              Return to the same line often enough that the first moves become automatic in real games.
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload" className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700">
              Analyze a Game
            </Link>
            <Link href="/openings" className="rounded-full border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-gray-800">
              Explore Openings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

