/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  // Your app uses API routes which require server-side rendering
  images: { 
    unoptimized: true 
  },
  // Optional: Add a trailing slash to all paths
  // trailingSlash: true,
  
  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'pg-native': false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        path: false,
      };
      
      // Exclude pg and related modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pg': 'pg',
        'pg-native': 'pg-native',
        'pg-connection-string': 'pg-connection-string',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
