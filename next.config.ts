import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'karin-and-noam-wedding-album.s3.il-central-1.amazonaws.com',
        port: '',
        pathname: '/wedding-uploads/**',
      },
    ],
  },
};

export default nextConfig;
