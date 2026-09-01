import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/home.dc.html"
        },
        {
          source: "/screenings",
          destination: "/screenings.dc.html"
        },
        {
          source: "/events/society-videodrome-double-feature",
          destination: "/society-videodrome-screening.dc.html"
        }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  }
};

export default nextConfig;
