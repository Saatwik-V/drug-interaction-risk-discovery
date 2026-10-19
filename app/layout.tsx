import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 75px)', padding: '32px 0 64px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
