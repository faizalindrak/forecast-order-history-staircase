import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Removed custom webpack config to allow Turbopack in dev
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
