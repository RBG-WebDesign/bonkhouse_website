import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/Bonkhouse%20Home%20-%20Current.dc.html"
        },
        {
          source: "/screenings",
          destination: "/Screenings.dc.html"
        },
        {
          source: "/events/society-videodrome-double-feature",
          destination: "/Society%20Videodrome%20Screening.dc.html"
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
