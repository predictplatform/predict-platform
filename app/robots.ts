import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/api/', '/setup', '/profile'],
      },
    ],
    sitemap: 'https://dawri-tawaquat.com/sitemap.xml',
  };
}
