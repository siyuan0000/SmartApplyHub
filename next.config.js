/** @type {import('next').NextConfig} */
  const nextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: '/SmartApplyHub',
    images: {
      unoptimized: true
    },
    eslint: {
      ignoreDuringBuilds: true
    }
  }

  module.exports = nextConfig
