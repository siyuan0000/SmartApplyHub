/** @type {import('next').NextConfig} */
  const nextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '/SmartApply-Hub',
    images: {
      unoptimized: true
    },
    eslint: {
      ignoreDuringBuilds: true
    }
  }

  module.exports = nextConfig
