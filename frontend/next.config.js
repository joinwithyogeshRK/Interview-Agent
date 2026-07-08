/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'https://interview-agent.up.railway.app'

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['d8j0ntlcm91z4.cloudfront.net'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${BACKEND_URL}/ws/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
