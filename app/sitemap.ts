import { MetadataRoute } from 'next'
import { openingPages } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://openingmaster.xyz'
  const staticPages = [
    '/home',
    '/about-us',
    '/dashboard',
    '/learn',
    '/openings',
    '/practice',
    '/settings',
    '/support',
    '/training',
    '/upload',
  ]

  return [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    })),
    ...openingPages.map((opening) => ({
      url: `${baseUrl}/openings/${opening.slug}`,
      lastModified: new Date(),
    })),
  ]
}
