import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["saved-morality-fanfare.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
