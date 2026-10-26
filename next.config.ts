import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatares do Discord e imagens enviadas pelo painel (Supabase Storage)
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
