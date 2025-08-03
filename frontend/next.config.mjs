/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from client-side bundle
      config.externals = config.externals || []
      config.externals.push({
        '@supabase/supabase-js': '@supabase/supabase-js',
      })
    }
    return config
  },
}

export default nextConfig
