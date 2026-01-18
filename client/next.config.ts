import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  webpack: (config, { isServer, webpack }) => {
    // Ignore test files and tap module
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.(js|ts|tsx)$/,
      }),
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          // Ignore tap module in test files
          if (resource.includes('tap') && resource.includes('test')) {
            return true;
          }
          return false;
        },
      })
    );

    // Ignore tap module in resolve
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      tap: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        tap: false,
      };
    }

    return config;
  },
};

export default nextConfig;
