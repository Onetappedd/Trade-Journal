import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'date-fns/locale/en-US': path.resolve(__dirname, 'shims/date-fns-locale-en-US.mjs'),
    }
    return config
  },
}

export default nextConfig
