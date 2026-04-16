import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://openingmaster.xyz'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/training`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
    },
  ]
}
