/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle so the Docker runtime stage can drop
  // node_modules entirely.
  output: 'standalone',
  reactStrictMode: true,
  // Keeps the dev overlay badge out of captured screenshots.
  devIndicators: false,
  experimental: {
    typedRoutes: true,
  },
  images: {
    // `images.domains` is deprecated; remotePatterns is the supported form.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  eslint: {
    dirs: ['src'],
  },
}

module.exports = nextConfig
