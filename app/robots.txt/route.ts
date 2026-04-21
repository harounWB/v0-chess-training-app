export const dynamic = 'force-static'

export function GET() {
  const siteUrl = 'https://openingmaster.xyz'

  return new Response(
    `User-Agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.txt
Sitemap: ${siteUrl}/sitemap.xml
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
