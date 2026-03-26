import type { Metadata } from 'next';
import Link from 'next/link';
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
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-blush/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-baseline justify-between">
            <Link href="/" className="group">
              <h1 className="font-display text-2xl italic text-ink tracking-tight">
                Fully Fashioned
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-smoke block -mt-0.5">
                A KmikeyM &times; curtmerrill collaboration
              </span>
            </Link>
            <div className="flex gap-6 text-sm font-body text-smoke">
              <Link
                href="/"
                className="hover:text-ink transition-colors"
              >
                Fits
              </Link>
              <Link
                href="/items"
                className="hover:text-ink transition-colors"
              >
                Wardrobe
              </Link>
              <Link
                href="/stats"
                className="hover:text-ink transition-colors"
              >
                Stats
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="border-t border-blush/60 mt-20">
          <div className="max-w-5xl mx-auto px-6 py-8 flex items-baseline justify-between">
            <p className="text-xs font-mono text-smoke/60 tracking-wide">
              Dress with purpose &mdash; since 2012
            </p>
            <p className="text-xs font-mono text-smoke/40">
              K5M &times; curtmerrill
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
