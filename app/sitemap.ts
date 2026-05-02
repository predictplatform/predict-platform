import { MetadataRoute } from 'next';

const SITE_URL = 'https://dawri-tawaquat.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              SITE_URL,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${SITE_URL}/matches`,
      lastModified:     new Date(),
      changeFrequency:  'hourly',
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/predict`,
      lastModified:     new Date(),
      changeFrequency:  'hourly',
      priority:         0.9,
    },
    {
      url:              `${SITE_URL}/leaderboard`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.8,
    },
    {
      url:              `${SITE_URL}/standings`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.7,
    },
    {
      url:              `${SITE_URL}/stats`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.6,
    },
  ];
}
