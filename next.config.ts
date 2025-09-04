import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Disable TypeScript errors during build for now
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint errors during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configure webpack to handle chunk loading issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure consistent chunk names in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // Improve development experience
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
};

export default nextConfig;
