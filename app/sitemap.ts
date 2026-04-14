import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://openingmaster.xyz',
      lastModified: new Date(),
    },
    {
      url: 'https://openingmaster.xyz/support',
      lastModified: new Date(),
    },
    {
      url: 'https://openingmaster.xyz/training',
      lastModified: new Date(),
    },
    {
      url: 'https://openingmaster.xyz/upload',
      lastModified: new Date(),
    },
  ]
}