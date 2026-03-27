'use client';

import { useState } from 'react';

export default function RetiredToggle({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="relative z-10 max-w-3xl mx-auto w-full" style={{ padding: '16px var(--pad) 0' }}>
        <button
          onClick={() => setShow(!show)}
          className="txt-meta opacity-30 hover:opacity-60 transition-opacity cursor-pointer"
        >
          {show ? 'Hide retired' : 'Show retired items'}
        </button>
      </div>
      {show && children}
    </div>
  );
}
