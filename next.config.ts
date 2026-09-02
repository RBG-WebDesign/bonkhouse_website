import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Mirrors the netlify.toml redirects so `npm run dev` serves the same
  // static design-canvas pages. One event page handles every screening slug.
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
          source: "/events/:slug",
          destination: "/event.dc.html"
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
