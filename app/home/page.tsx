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
    <main className="min-h-screen bg-[#0b0f14] text-gray-100">
      <Header />

      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-10">
              <p className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
                Chess Opening Trainer and Free PGN Analyzer
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Chess Opening Trainer - Learn & Practice Openings Fast
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
                OpeningMaster helps you train openings move by move, analyze PGN files, and turn real game mistakes into better opening habits.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/upload"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-200"
                >
                  Analyze a PGN
                </Link>
                <Link
                  href="/training"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-white/[0.08]"
                >
                  Start Training
                </Link>
                <Link
                  href="/openings"
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/15"
                >
                  Explore Openings
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-gray-900/60 p-7 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Quick overview</p>
              <div className="mt-5 space-y-4">
                {featurePages.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-gray-200">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Core Pages</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Start with the part you need most</h2>
          <p className="mt-3 text-sm leading-6 text-gray-400 sm:text-base">
            The main pages stay focused so you can move straight into analysis, training, or account setup without hunting around.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {corePages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{page.label}</p>
                <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-300">Open</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-14 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Learning / Blog</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Chess opening study for beginners and improvers</h2>
            <p className="mt-3 text-gray-400">
              These learning topics are written to help players understand opening study, game analysis, and rating improvement without making the process feel overwhelming.
            </p>
            <div className="mt-6 space-y-3">
              {learningTopics.map((topic) => (
                <div key={topic.title} className="rounded-2xl border border-white/8 bg-black/20 p-5">
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

          <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Opening-Specific Pages</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Make your repertoire searchable</h2>
            <p className="mt-3 text-gray-300">
              Opening pages help players find exactly what they want to study, from the Sicilian Defense to the Queen's Gambit.
            </p>
            <div className="mt-6 space-y-3">
              {openingPages.map((opening) => (
                <Link
                  key={opening.slug}
                  href="/openings"
                  className="block rounded-2xl border border-white/8 bg-black/20 px-4 py-3 transition-colors hover:border-white/14 hover:bg-white/[0.05]"
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
