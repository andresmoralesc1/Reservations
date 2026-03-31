/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Only use standalone in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  serverExternalPackages: ['postgres'],
  // Improve hot reload reliability
  experimental: {
    optimizePackageImports: ['lucide-react', '@dnd-kit/core'],
  },
}

module.exports = nextConfig
