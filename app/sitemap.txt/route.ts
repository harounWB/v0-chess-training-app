import { openingPages } from '@/lib/seo'

export const dynamic = 'force-static'

function buildSitemapText() {
  const staticUrls = [
    'https://openingmaster.xyz/home',
    'https://openingmaster.xyz/about-us',
    'https://openingmaster.xyz/learn',
    'https://openingmaster.xyz/openings',
    'https://openingmaster.xyz/support',
  ]

  const openingUrls = openingPages.map(
    (opening) => `https://openingmaster.xyz/openings/${opening.slug}`
  )

  return [...staticUrls, ...openingUrls].join('\n')
}

export function GET() {
  return new Response(buildSitemapText(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
