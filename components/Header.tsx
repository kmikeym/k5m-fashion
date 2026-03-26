'use client';

import Link from 'next/link';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { SignedIn, SignedOut } from './AuthGate';

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

export default function Header() {
  return (
    <header
      className="flex justify-between items-start relative z-10 max-w-3xl mx-auto w-full"
      style={{ padding: '48px var(--pad) 16px' }}
    >
      <div className="flex flex-col">
        <Link href="/" className="txt-meta hover:opacity-70 transition-opacity">
          Mike&apos;s Wardrobe
        </Link>
        <nav className="flex gap-4 mt-1 items-center">
          <Link href="/" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
            Fits
          </Link>
          <Link href="/items" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
            Wardrobe
          </Link>
          <Link href="/stats" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
            Stats
          </Link>
          <SignedIn>
            <Link href="/admin" className="txt-meta opacity-30 hover:opacity-100 transition-opacity">
              Admin
            </Link>
          </SignedIn>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </SignedIn>
        <CircularStamp />
      </div>
    </header>
  );
}
