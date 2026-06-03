import type { NextConfig } from "next";

const scriptSource = process.env.NODE_ENV === "production"
  ? "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "saved-morality-fanfare.ngrok-free.dev"],
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: `default-src 'self'; ${scriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.ufs.sh https://utfs.io https://img.clerk.com https://image.mux.com; media-src 'self' blob: https://stream.mux.com https://*.mux.com; connect-src 'self' https: wss:; frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://player.mux.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com` },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
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
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
    ],
  },
};

export default nextConfig;
