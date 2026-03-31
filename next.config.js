/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  serverExternalPackages: ['postgres'],
}

module.exports = nextConfig
