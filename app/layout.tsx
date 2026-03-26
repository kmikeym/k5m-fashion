import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fully Fashioned — K5M',
  description: 'Dress with purpose. Rate outfits, discover what works.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="noise-overlay" />

          <div className="w-full relative overflow-x-hidden flex flex-col min-h-screen">
            <Header />

            {/* Content */}
            {children}

            {/* Footer */}
            <div
              className="relative z-10 max-w-3xl mx-auto w-full"
              style={{
                padding: '48px var(--pad)',
                borderTop: '1px solid var(--color-line)',
              }}
            >
              <p className="txt-meta opacity-40">
                Fully Fashioned &mdash; A KmikeyM &times; curtmerrill collaboration
              </p>
              <p className="txt-meta opacity-25 mt-1">
                Dress with purpose &mdash; since 2012
              </p>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
