/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app uses API routes which require a server, so output cannot be 'export'.
  
  // Configure Next.js Image Optimization
  images: {
    // Instead of unoptimized: true, we specify the domains that host images.
    // This enables performance benefits like automatic resizing and modern format conversion.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      // TODO: Add the hostname for your production deployment (e.g., 'your-app.com')
      // {
      //   protocol: 'https',
      //   hostname: 'your-app.com',
      //   pathname: '/**',
      // },
    ],
  },
  
  // Webpack configuration to handle Node.js modules on the client-side.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-side modules from the client bundle to prevent errors and reduce bundle size.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'pg-native': false,
      };
    }
    // On the server, we don't need to do anything special.
    return config;
  },
};

module.exports = nextConfig;