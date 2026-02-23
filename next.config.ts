import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Adjust as needed, default is 1mb
    },
  },
};

export default nextConfig;
