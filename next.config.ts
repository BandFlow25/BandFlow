import type { NextConfig } from "next";
//TODO: FIX THIS
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Suppress ESLint warnings during build
  },
  typescript: {
    ignoreBuildErrors: true, // Suppress TypeScript errors during build
  },
};

export default nextConfig;
