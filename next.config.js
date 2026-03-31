/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Temporarily disable standalone output due to Next.js 16 build issue
  // output: 'standalone',
  serverExternalPackages: ['postgres'],
}

module.exports = nextConfig
