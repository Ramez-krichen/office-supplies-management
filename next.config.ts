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
};

export default nextConfig;
