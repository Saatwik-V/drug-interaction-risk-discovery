import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/ui/Toast';

// Self-hosted via next/font: fonts are fetched and inlined at build time, so
// the app has zero runtime dependency on Google Fonts' CDN — required for
// offline viva demos where Wi-Fi may be unavailable or unreliable.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RxGraph — Patient-Specific Multi-Hop Drug Interaction Risk Discovery',
  description:
    'An experiential learning dual-database prototype comparing relational lookups with bounded graph traversals for polypharmacy risk discovery. PES University DBMS Level 3.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ToastProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 75px)', padding: '32px 0 64px' }}>
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
