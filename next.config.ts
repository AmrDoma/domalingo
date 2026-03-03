import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is only needed for Docker/Cloud Run builds, not Vercel
  ...(process.env.DOCKER_BUILD === "true" && { output: "standalone" }),
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Wikipedia / Wikimedia images
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Pexels images
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
