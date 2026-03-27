// D1 database helper
// In Cloudflare Pages, the DB binding is available on the request context
// We access it via the Next.js runtime environment

export interface Env {
  DB: D1Database;
}

export function getDB(): D1Database | null {
  try {
    // Cloudflare Pages exposes bindings via process.env in edge runtime
    const db = (process.env as Record<string, unknown>).DB as D1Database | undefined;
    if (db && typeof db.prepare === 'function') return db;
    return null;
  } catch {
    return null;
  }
}

// For Cloudflare Pages with next-on-pages, use getRequestContext
export async function getD1(): Promise<D1Database | null> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    return env.DB || null;
  } catch {
    return null;
  }
}
