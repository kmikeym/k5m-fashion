'use client';

import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ADMIN_USER_ID } from '@/lib/constants';

export default function PostPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorial, setEditorial] = useState(false);
  const isAdmin = user?.id === ADMIN_USER_ID;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', description);
      if (editorial) formData.append('bucket', 'general');

      const res = await fetch('/api/outfits/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      // Redirect to home feed after posting
      router.push('/');
    } catch {
      setError('Something went wrong');
      setUploading(false);
    }
  }

  if (!isLoaded) return null;

  return (
    <section
      className="relative z-10 w-full"
      style={{ borderTop: '1px solid var(--color-text)' }}
    >
      <div
        className="max-w-3xl mx-auto w-full"
        style={{ padding: '64px var(--pad)' }}
      >
        <div className="mb-12">
          <p className="txt-meta mb-4">New Post</p>
          <h2 className="txt-display-outline">What are</h2>
          <h3 className="txt-display-solid">you wearing?</h3>
        </div>

        {!isSignedIn ? (
          <div className="py-16 text-center">
            <p className="txt-meta opacity-50 mb-4">Sign in to post your fit</p>
            <SignInButton mode="modal">
              <button className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Photo picker */}
            <div className="mb-8">
              {preview ? (
                <div className="fit-photo-container" style={{ maxWidth: 400 }}>
                  <img src={preview} alt="Preview" />
                </div>
              ) : (
                <label
                  className="block border border-dashed border-ink/30 p-12 text-center cursor-pointer hover:bg-ink/5 transition-colors"
                  style={{ aspectRatio: '3/4', maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="txt-meta opacity-50">Tap to add photo</span>
                </label>
              )}
              {preview && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="txt-meta opacity-50 hover:opacity-100 mt-2 cursor-pointer"
                >
                  Change photo
                </button>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="txt-meta font-semibold uppercase block mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the vibe?"
                className="w-full bg-transparent border-b border-ink/30 py-2 text-sm focus:outline-none focus:border-ink"
                style={{ fontFamily: 'var(--font-primary)' }}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="txt-meta text-red-600 mb-4">{error}</p>
            )}

            {/* Editorial toggle (admin only) */}
            {isAdmin && (
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorial}
                  onChange={(e) => setEditorial(e.target.checked)}
                  className="accent-current"
                />
                <span className="txt-meta">Post as Editorial</span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!file || uploading}
              className="txt-meta font-bold uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                padding: '16px 32px',
                border: '1px solid var(--color-text)',
              }}
            >
              {uploading ? 'Posting...' : 'Post today\'s fit'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
