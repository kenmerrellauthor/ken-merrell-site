'use client';
import Image from 'next/image';
import CoverRevealSoon from './CoverRevealSoon';
import type { Book } from '@/lib/types';

interface Book3DProps {
  book?: Book | null;
  placeholderTitle?: string;
  variant?: 1 | 2 | 3 | 4;
  isCenter?: boolean;
  priority?: boolean;
}

export default function Book3D({
  book,
  placeholderTitle,
  variant = 1,
  isCenter = false,
  priority = false
}: Book3DProps) {
  const hasCover = Boolean(book?.cover);

  return (
    <div
      className={`b3d-wrap ${isCenter ? 'b3d-center' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Golden Backlight Ambient Glow for Center Active Book */}
      {isCenter && (
        <div
          className="b3d-glow"
          style={{
            position: 'absolute',
            left: '-20%',
            right: '-20%',
            top: '-15%',
            bottom: '-15%',
            zIndex: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(214, 172, 88, 0.45) 0%, rgba(184, 137, 48, 0.22) 40%, rgba(18, 15, 12, 0) 70%)',
            filter: 'blur(16px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Book Solid Body */}
      <div
        className="b3d-body"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 2,
          boxShadow: isCenter
            ? '0 32px 55px -8px rgba(0, 0, 0, 0.95), 0 12px 25px -4px rgba(0, 0, 0, 0.8), -6px 8px 18px rgba(0,0,0,0.6)'
            : '0 24px 45px -8px rgba(0, 0, 0, 0.9), 0 8px 18px -4px rgba(0, 0, 0, 0.75)',
          borderRadius: '2px 4px 4px 2px',
          overflow: 'hidden',
          background: '#120f0d',
        }}
      >
        {/* Book Face (Front Cover) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {hasCover && book?.cover ? (
            <Image
              src={book.cover}
              alt={book.title || 'Book cover'}
              fill
              sizes="(max-width: 768px) 240px, 320px"
              priority={priority}
              draggable={false}
              style={{
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          ) : (
            <CoverRevealSoon
              author="KEN MERRELL"
              variant={variant}
              title={placeholderTitle || book?.title}
            />
          )}

          {/* Realistic Hardcover Book Edge Lighting & Sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 4%, transparent 12%, rgba(0,0,0,0.2) 98%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Spine Crease */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 14,
              width: 3,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.3) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Spine Edge Left Strip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 14,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* 3D Page Block on the Right Edge */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            right: 0,
            width: 7,
            background: 'linear-gradient(90deg, #1b1612 0%, #d8cdbe 35%, #eadecd 60%, #c4b6a3 100%)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5), inset -1px 0 2px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {/* Subtle horizontal paper layer lines */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)',
            }}
          />
        </div>
      </div>

      {/* Surface Reflection & Contact Shadow Underneath */}
      <div
        className="b3d-shadow"
        style={{
          position: 'absolute',
          left: '4%',
          right: '4%',
          bottom: -18,
          height: 24,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 80%)',
          filter: 'blur(5px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
