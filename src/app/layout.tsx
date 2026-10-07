import type { Metadata } from 'next';
import { Outfit, Poppins } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://roboledpartner.com.br'),
  title: 'Cotação Automática de Eventos | Robô LED Partner',
  description:
    'Calcule seu orçamento personalizado em segundos com Robô de LED, Personagens Vivos e Efeitos Especiais da Robô LED Partner para Casamentos, Aniversários, 15 Anos e Corporativos.',
  keywords: [
    'Robô de LED',
    'Robô LED Partner',
    'Cotação Eventos',
    'Personagens Vivos',
    'Cilindro CO2',
    'Gerb Indoor',
    'Casamento',
    'Aniversário',
    '15 Anos',
    'Festa Corporativa',
    'São Paulo',
    'São Bernardo do Campo',
  ],
  authors: [{ name: 'Robô LED Partner' }],
  openGraph: {
    title: 'Robô LED Partner — Cotação Automática para o Seu Evento',
    description:
      'Gere seu orçamento comercial online em instantes. Robô de LED, Personagens, Efeitos e Frete calculado automaticamente.',
    url: 'https://roboledpartner.com.br',
    siteName: 'Robô LED Partner',
    images: [
      {
        url: '/images/robo-hero.png',
        width: 1200,
        height: 630,
        alt: 'Robô LED Partner — Atrações para Eventos',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cotação Automática | Robô LED Partner',
    description: 'Calcule seu orçamento comercial para eventos em tempo real.',
    images: ['/images/robo-hero.png'],
  },
  icons: {
    icon: '/images/logo-header.png',
    apple: '/images/logo-header.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${poppins.variable} dark`}>
      <body className="min-h-screen bg-[#090a10] text-slate-100 font-sans flex flex-col selection:bg-fuchsia-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
