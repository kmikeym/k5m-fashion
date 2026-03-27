'use client';

import { useState } from 'react';
import type { Item } from '@/lib/types';

interface ItemImageProps {
  item: Item;
  size: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { width: 40, height: 48 },
  md: { width: 64, height: 80 },
  lg: { width: '100%' as const, aspectRatio: '3/4' },
};

const initialSizes = {
  sm: 20,
  md: 28,
  lg: 42,
};

export default function ItemImage({ item, size }: ItemImageProps) {
  const [imgError, setImgError] = useState(!item.image);

  if (imgError) {
    const dims = sizeStyles[size];
    const initial = item.name.charAt(0).toUpperCase();

    return (
      <div
        className="flex flex-col items-center justify-center flex-shrink-0"
        style={{
          ...dims,
          border: '1px solid var(--color-text)',
          background: 'rgba(255,255,255,0.3)',
        }}
      >
        <span
          className="txt-display-outline leading-none"
          style={{ fontSize: initialSizes[size] }}
        >
          {initial}
        </span>
        {size !== 'sm' && (
          <span
            className="txt-meta uppercase opacity-50 mt-1"
            style={{ fontSize: size === 'lg' ? 11 : 9 }}
          >
            {item.category}
          </span>
        )}
      </div>
    );
  }

  const dims = sizeStyles[size];

  return (
    <img
      src={item.image}
      alt={item.name}
      className="flex-shrink-0 object-cover"
      style={{
        ...dims,
        border: '1px solid var(--color-text)',
      }}
      onError={() => setImgError(true)}
    />
  );
}
