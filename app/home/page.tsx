import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { corePages, featurePages, learningTopics, openingPages } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Chess Opening Trainer - Learn & Practice Openings Fast',
  description: 'Free chess opening trainer and PGN analyzer for learning openings faster, spotting mistakes, and building a stronger repertoire.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.25),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_34%)]" />
        <div className="relative container mx-auto max-w-7xl px-4 py-20">
          <div className="max-w-4xl">
            <p className="mb-4 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
              Chess Opening Trainer and Free PGN Analyzer
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Chess Opening Trainer - Learn & Practice Openings Fast
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              OpeningMaster helps you train openings move by move, analyze PGN files, and turn real game mistakes into better opening habits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/upload" className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700">
                Analyze a PGN
              </Link>
              <Link href="/training" className="rounded-full border border-gray-700 bg-gray-900/70 px-5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-gray-800">
                Start Training
              </Link>
              <Link href="/openings" className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20">
                Explore Openings
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {featurePages.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 backdrop-blur">
                <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {corePages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 transition-transform hover:-translate-y-1 hover:border-gray-700"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{page.label}</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{page.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Learning / Blog</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Chess opening study for beginners and improvers</h2>
            <p className="mt-3 text-gray-400">
              These learning topics are written to help players understand opening study, game analysis, and rating improvement without making the process feel overwhelming.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {learningTopics.map((topic) => (
                <div key={topic.title} className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                  <h3 className="font-semibold text-white">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{topic.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/learn" className="text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
                Open the learning hub
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-purple-600/15 to-cyan-500/10 p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Opening-Specific Pages</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Make your repertoire searchable</h2>
            <p className="mt-3 text-gray-300">
              Opening pages help players find exactly what they want to study, from the Sicilian Defense to the Queen's Gambit.
            </p>
            <div className="mt-6 space-y-3">
              {openingPages.map((opening) => (
                <Link
                  key={opening.slug}
                  href={`/openings/${opening.slug}`}
                  className="block rounded-2xl border border-gray-800 bg-gray-950/70 px-4 py-3 transition-colors hover:border-gray-700 hover:bg-gray-900"
                >
                  <div className="text-sm font-medium text-white">{opening.title}</div>
                  <div className="mt-1 text-xs text-gray-400">{opening.description}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

