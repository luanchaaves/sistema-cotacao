import type { NextConfig } from 'next';

const CENTRAL_API_URL =
  process.env.CENTRAL_API_URL ||
  process.env.NEXT_PUBLIC_CENTRAL_API_URL ||
  'http://localhost:3101';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Encaminha requisições de /uploads/* diretamente para a Gestão Integrada se não existirem localmente
        source: '/uploads/:path*',
        destination: `${CENTRAL_API_URL.replace(/\/+$/, '')}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
