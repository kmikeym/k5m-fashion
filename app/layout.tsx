import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fully Fashioned — K5M',
  description: 'Dress with purpose. Rate outfits, discover what works.',
};

function CircularStamp() {
  return (
    <svg className="circular-stamp" viewBox="0 0 100 100">
      <path
        id="circlePath"
        d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
        fill="none"
      />
      <text>
        <textPath href="#circlePath" startOffset="0%">
          Fully Fashioned &bull; Cast Vote &bull;
        </textPath>
      </text>
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="noise-overlay" />

        <div className="w-full max-w-[430px] md:max-w-[860px] relative overflow-x-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <header
            className="flex justify-between items-start relative z-10"
            style={{
              padding: '48px var(--pad) 16px',
              background: 'var(--grad-warm)',
            }}
          >
            <div className="flex flex-col">
              <Link href="/" className="txt-meta hover:opacity-70 transition-opacity">
                Mike&apos;s Wardrobe
              </Link>
              <nav className="flex gap-4 mt-1">
                <Link
                  href="/"
                  className="txt-meta opacity-60 hover:opacity-100 transition-opacity"
                >
                  Fits
                </Link>
                <Link
                  href="/items"
                  className="txt-meta opacity-60 hover:opacity-100 transition-opacity"
                >
                  Wardrobe
                </Link>
                <Link
                  href="/stats"
                  className="txt-meta opacity-60 hover:opacity-100 transition-opacity"
                >
                  Stats
                </Link>
              </nav>
            </div>
            <CircularStamp />
          </header>

          {/* Content */}
          {children}

          {/* Footer */}
          <div
            className="relative z-10"
            style={{
              padding: '48px var(--pad)',
              borderTop: '1px solid var(--color-text)',
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
  );
}
