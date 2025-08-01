/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placeholder.svg'],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
