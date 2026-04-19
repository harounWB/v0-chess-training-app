import Link from 'next/link';
import { corePages, footerKeywords } from '@/lib/seo';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/95 px-4 py-8">
      <div className="container mx-auto max-w-7xl space-y-6 text-sm text-gray-400">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-gray-300">OpeningMaster helps you study openings, analyze PGNs, and train faster.</p>
          <div className="flex flex-wrap gap-4">
            {corePages.map((page) => (
              <Link key={page.href} href={page.href} className="transition-colors hover:text-white">
                {page.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Popular searches</p>
          <p className="mt-2 leading-relaxed text-gray-300">{footerKeywords.join(' · ')}</p>
        </div>
      </div>
    </footer>
  );
}

