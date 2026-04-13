/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'isrqhxhoabxkpunmbxti.supabase.co',
        pathname: '/**',
      },
    ],
    domains: ['isrqhxhoabxkpunmbxti.supabase.co'],
  },
};

export default nextConfig;
