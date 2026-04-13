import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'isrqhxhoabxkpunmbxti.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
