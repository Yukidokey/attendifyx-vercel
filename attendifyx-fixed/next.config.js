/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Prevent server-side bundling of browser-only packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'html5-qrcode',
        'idb',
      ];
    }
    return config;
  },
}

module.exports = nextConfig
