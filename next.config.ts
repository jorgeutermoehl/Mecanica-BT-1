import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace neste projeto (havia um package-lock.json solto
  // em C:\Users\jorge que confundia a detecção automática do Turbopack).
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
