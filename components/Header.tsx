'use client';

import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { SignedIn, SignedOut } from './AuthGate';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmikeym@kmikeym.com';

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
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

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
            <Link href="/my-votes" className="txt-meta opacity-60 hover:opacity-100 transition-opacity">
              My Votes
            </Link>
          </SignedIn>
          {isAdmin && (
            <Link href="/admin" className="txt-meta opacity-30 hover:opacity-100 transition-opacity">
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
        <CircularStamp />
        <div className="absolute inset-0 flex items-center justify-center">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center cursor-pointer hover:bg-ink/20 transition-colors">
                <span style={{ fontSize: 10, fontWeight: 700 }}>?</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
