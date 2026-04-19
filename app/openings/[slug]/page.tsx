import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { openingPageMap, openingPages } from '@/lib/seo';

type Params = {
  slug: string;
};

export function generateStaticParams() {
  return openingPages.map((opening) => ({ slug: opening.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const opening = openingPageMap.get(params.slug);

  if (!opening) {
    return {};
  }

  return {
    title: opening.title,
    description: opening.description,
  };
}

export default function OpeningPage({ params }: { params: Params }) {
  const opening = openingPageMap.get(params.slug);

  if (!opening) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Opening Guide</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">{opening.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-300">{opening.description}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {opening.plan.map((step, index) => (
            <div key={step} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Step {index + 1}</p>
              <p className="mt-3 text-sm leading-6 text-gray-300">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-gray-800 bg-gray-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">How to use this page</h2>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Study the main ideas first, then use the training board to repeat the relevant move orders until the opening starts to feel familiar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/training" className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700">
              Train this opening
            </Link>
            <Link href="/openings" className="rounded-full border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-100 transition-colors hover:bg-gray-800">
              View more openings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

