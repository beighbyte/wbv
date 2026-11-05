import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["localhost:3000", "192.168.31.29:3000"],
};

export default nextConfig;
