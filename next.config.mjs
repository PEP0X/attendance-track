/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'

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
  // Ensure headers allow service worker scope if basePath used in future
}

export default withPWA({
  dest: 'public',
  disable: isDev, // keep SW off in dev; enable on build/start
  register: true,
  skipWaiting: true,
  // App Router offline page is /_offline by convention supported by next-pwa
  fallbacks: {
    document: '/_offline',
  },
  // Reduce logs in dev if enabled manually
  mode: isDev ? 'development' : 'production',
})(nextConfig)
