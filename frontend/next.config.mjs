/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Force all API routes to be dynamic
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ]
  },
  // Skip static generation for dashboard routes
  exportPathMap: async function (defaultPathMap) {
    const pathMap = {}
    // Only include non-dashboard routes for static generation
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/dashboard')) {
        pathMap[path] = page
      }
    }
    return pathMap
  }
}

export default nextConfig