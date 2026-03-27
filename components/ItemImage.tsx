'use client';

import { useState } from 'react';
import type { Item } from '@/lib/types';
import { getDisplayName } from '@/lib/data';

interface ItemImageProps {
  item: Item;
  size: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { width: 40, height: 48 },
  md: { width: 64, height: 80 },
  lg: { width: '100%' as const, aspectRatio: '3/4' },
};

const categoryIcons: Record<string, string> = {
  hats: 'M50 25c-15 0-28 8-28 20v5h56v-5c0-12-13-20-28-20z M18 50h64',
  tops: 'M35 20l-15 10v25h10v20h40v-20h10v-25l-15-10h-30z',
  bottoms: 'M35 20h30v15l-5 40h-8l-7-40-7 40h-8l-5-40v-15z',
  shoes: 'M20 50l5-10h15v-5h20v5h15l5 10h-60z M20 50h60v5h-60z',
  outerwear: 'M32 18l-17 12v30h12v-22h6v22h14v-22h6v22h12v-30l-17-12h-16z',
  accessories: 'M50 25a20 20 0 1 0 0 40 20 20 0 1 0 0-40z M35 45a15 12 0 0 1 30 0',
};

export default function ItemImage({ item, size }: ItemImageProps) {
  const [imgError, setImgError] = useState(!item.image);

  if (imgError) {
    const dims = sizeStyles[size];
    const iconPath = categoryIcons[item.category] || categoryIcons.accessories;

    return (
      <div
        className="flex flex-col items-center justify-center flex-shrink-0"
        style={{
          ...dims,
          border: '1px solid var(--color-text)',
          background: 'rgba(255,255,255,0.3)',
        }}
      >
        <svg
          viewBox="0 0 100 80"
          fill="none"
          stroke="var(--color-text)"
          strokeWidth="2"
          style={{ width: '55%', height: '55%', opacity: 0.25 }}
        >
          <path d={iconPath} />
        </svg>
        {size !== 'sm' && (
          <span
            className="txt-meta uppercase opacity-40 mt-1"
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
      alt={getDisplayName(item)}
      className="flex-shrink-0 object-cover"
      style={{
        ...dims,
        border: '1px solid var(--color-text)',
      }}
      onError={() => setImgError(true)}
    />
  );
}
