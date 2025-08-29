import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/analytics/',
          '/api/',
          '/auth/',
          '/admin/',
          '/_next/',
          '/sandbox/',
        ],
      },
    ],
    sitemap: 'https://profitpad.com/sitemap.xml',
  }
}
