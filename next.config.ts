import type { NextConfig } from 'next';

/**
 * Obtém a origem (protocolo + host + porta) do servidor central da Gestão Integrada.
 * Se a URL configurada terminar em '/api' (como em homologação e produção),
 * remove o segmento '/api' para que os rewrites de arquivos estáticos como '/uploads/*'
 * sejam encaminhados corretamente para a raiz do servidor central (ex: http://host:port/uploads/*)
 * sem gerar incorretamente caminhos como '/api/uploads/*'.
 */
function getCentralOrigin(): string {
  const rawUrl =
    process.env.CENTRAL_API_URL ||
    process.env.NEXT_PUBLIC_CENTRAL_API_URL ||
    'http://localhost:3101';

  try {
    const parsed = new URL(rawUrl);
    return parsed.origin;
  } catch {
    return rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
}

const CENTRAL_ORIGIN = getCentralOrigin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Encaminha requisições de /uploads/* diretamente para a Gestão Integrada
        source: '/uploads/:path*',
        destination: `${CENTRAL_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
