'use client';

import { useState, useEffect } from 'react';

const KEY = 'ff_token';

/**
 * The anonymous vote identity for this device. Minted once and persisted in
 * localStorage (cookie fallback for the IG in-app browser, which can block or
 * clear localStorage). Returns null until mounted, then a stable UUID.
 *
 * This is the vote identity for login-free voting (#15); on sign-in the token's
 * history is merged into the account via /api/votes/merge.
 */
export function useDeviceToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let t: string | null = null;
    try {
      t = localStorage.getItem(KEY);
      if (!t) {
        t = crypto.randomUUID();
        localStorage.setItem(KEY, t);
      }
    } catch {
      // localStorage unavailable (private mode / IG webview) — fall back to a cookie.
      t = readCookie(KEY);
      if (!t) {
        t = crypto.randomUUID();
        document.cookie = `${KEY}=${t}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
    setToken(t);
  }, []);

  return token;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
