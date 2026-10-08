'use client';

interface CoverRevealSoonProps {
  author?: string;
  variant?: 1 | 2 | 3 | 4;
  clothColor?: string;
  title?: string;
}

export default function CoverRevealSoon({
  author = 'KEN MERRELL',
  variant = 1,
  clothColor = '#151310',
  title
}: CoverRevealSoonProps) {
  // Variations in cloth tones to match the screenshot
  const bgStyles: Record<number, string> = {
    1: 'radial-gradient(circle at 45% 35%, #241c16 0%, #15110d 70%, #0d0a08 100%)', // warm leather umber
    2: 'radial-gradient(circle at 50% 30%, #1e221d 0%, #131713 70%, #0a0d0a 100%)', // deep forest spruce
    3: 'radial-gradient(circle at 48% 32%, #212620 0%, #141813 70%, #0b0e0b 100%)', // vintage antique olive
    4: 'radial-gradient(circle at 52% 35%, #201a18 0%, #13100e 70%, #0c0908 100%)', // dark chestnut leather
  };

  const bg = bgStyles[variant] || bgStyles[1];

  return (
    <div
      className="crs-cover"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: bg,
        overflow: 'hidden',
        color: '#c9a860',
        userSelect: 'none',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Leather/Linen texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.18,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '4px 4px',
          pointerEvents: 'none',
        }}
      />

      {/* Outer gold border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 12,
          border: '1px solid rgba(201, 168, 96, 0.45)',
          pointerEvents: 'none',
        }}
      />

      {/* Inner gold border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 16,
          border: '1px solid rgba(201, 168, 96, 0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* Corner corner-bracket accents */}
      <svg
        style={{ position: 'absolute', inset: 12, width: 'calc(100% - 24px)', height: 'calc(100% - 24px)', pointerEvents: 'none' }}
      >
        <path d="M 0,10 L 10,0 M 0,0 L 4,0 L 0,4" stroke="rgba(201,168,96,0.5)" strokeWidth="1" fill="none" />
        <path d="M calc(100% - 10px),0 L 100%,10" stroke="rgba(201,168,96,0.5)" strokeWidth="1" fill="none" />
        <path d="M 0,calc(100% - 10px) L 10,100%" stroke="rgba(201,168,96,0.5)" strokeWidth="1" fill="none" />
        <path d="M calc(100% - 10px),100% L 100%,calc(100% - 10px)" stroke="rgba(201,168,96,0.5)" strokeWidth="1" fill="none" />
      </svg>

      {/* Top author stamp */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, paddingTop: 6 }}>
        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 11,
            letterSpacing: '.32em',
            fontWeight: 600,
            color: '#c9a860',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(201,168,96,0.3)',
            display: 'inline-block',
          }}
        >
          {author}
        </span>
      </div>

      {/* Center foil stamp: COVER REVEAL SOON */}
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          margin: 'auto 0',
        }}
      >
        {/* Top small ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.65, marginBottom: 4 }}>
          <span style={{ width: 16, height: 1, background: '#c9a860' }} />
          <span style={{ fontSize: 9 }}>❖</span>
          <span style={{ width: 16, height: 1, background: '#c9a860' }} />
        </div>

        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 15,
            letterSpacing: '.38em',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#dec288',
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 12px rgba(201,168,96,0.35)',
          }}
        >
          COVER
        </span>
        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 15,
            letterSpacing: '.38em',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#dec288',
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 12px rgba(201,168,96,0.35)',
          }}
        >
          REVEAL
        </span>
        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 15,
            letterSpacing: '.38em',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#dec288',
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 12px rgba(201,168,96,0.35)',
          }}
        >
          SOON
        </span>

        {/* Bottom small ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.65, marginTop: 4 }}>
          <span style={{ width: 16, height: 1, background: '#c9a860' }} />
          <span style={{ fontSize: 9 }}>❖</span>
          <span style={{ width: 16, height: 1, background: '#c9a860' }} />
        </div>
      </div>

      {/* Bottom etched landscape artwork */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: 90,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          opacity: 0.45,
          marginBottom: 4,
        }}
      >
        {variant === 1 && (
          /* Landscape 1: Mountain ridge with misty pines */
          <svg viewBox="0 0 200 90" width="100%" height="90" fill="none" stroke="#c9a860" strokeWidth="0.8">
            <path d="M 10,80 Q 50,45 80,60 T 150,35 Q 180,65 195,80" opacity="0.6" />
            <path d="M 0,85 Q 40,60 90,72 T 160,50 Q 185,75 200,85" opacity="0.4" />
            {/* Pine silhouettes */}
            <path d="M 40,82 L 40,55 M 34,75 L 40,65 L 46,75 M 35,68 L 40,60 L 45,68" strokeWidth="1" />
            <path d="M 55,83 L 55,50 M 48,72 L 55,62 L 62,72 M 50,65 L 55,56 L 60,65" strokeWidth="1" />
            <path d="M 145,82 L 145,45 M 138,68 L 145,58 L 152,68 M 140,60 L 145,50 L 150,60" strokeWidth="1" />
            <path d="M 160,84 L 160,52 M 153,73 L 160,63 L 167,73" strokeWidth="1" />
            <line x1="15" y1="84" x2="185" y2="84" stroke="rgba(201,168,96,0.3)" />
          </svg>
        )}

        {variant === 2 && (
          /* Landscape 2: Tall pine trees grove */
          <svg viewBox="0 0 200 90" width="100%" height="90" fill="none" stroke="#c9a860" strokeWidth="0.8">
            <path d="M 85,84 L 85,38 M 75,70 L 85,55 L 95,70 M 78,60 L 85,48 L 92,60 M 80,52 L 85,42 L 90,52" strokeWidth="1.1" />
            <path d="M 115,84 L 115,32 M 104,66 L 115,50 L 126,66 M 107,55 L 115,42 L 123,55 M 110,46 L 115,36 L 120,46" strokeWidth="1.1" />
            <path d="M 135,84 L 135,46 M 127,72 L 135,60 L 143,72 M 129,63 L 135,52 L 141,63" strokeWidth="0.9" />
            <path d="M 65,84 L 65,50 M 58,74 L 65,63 L 72,74" strokeWidth="0.9" />
            <line x1="20" y1="84" x2="180" y2="84" stroke="rgba(201,168,96,0.3)" />
          </svg>
        )}

        {variant === 3 && (
          /* Landscape 3: Rustic cabin and large leafy oak tree */
          <svg viewBox="0 0 200 90" width="100%" height="90" fill="none" stroke="#c9a860" strokeWidth="0.8">
            {/* Cabin */}
            <path d="M 45,82 L 45,68 L 65,55 L 85,68 L 85,82 Z" opacity="0.8" />
            <path d="M 65,55 L 95,60 L 105,74 L 85,68" opacity="0.6" />
            <line x1="58" y1="82" x2="58" y2="72" />
            <line x1="72" y1="82" x2="72" y2="72" />
            {/* Grand Oak Tree */}
            <path d="M 145,84 C 145,72 142,65 145,55 C 135,50 130,35 142,28 C 150,22 165,24 170,32 C 178,35 180,48 172,56 C 176,62 170,72 155,75 L 155,84" strokeWidth="1" />
            <line x1="15" y1="84" x2="185" y2="84" stroke="rgba(201,168,96,0.3)" />
          </svg>
        )}

        {variant === 4 && (
          /* Landscape 4: Woodland homestead */
          <svg viewBox="0 0 200 90" width="100%" height="90" fill="none" stroke="#c9a860" strokeWidth="0.8">
            <path d="M 60,82 L 60,65 L 75,54 L 90,65 L 90,82 Z" opacity="0.75" />
            <path d="M 130,83 L 130,48 M 122,70 L 130,58 L 138,70 M 124,60 L 130,51 L 136,60" strokeWidth="1" />
            <path d="M 150,83 L 150,56 M 144,74 L 150,64 L 156,74" strokeWidth="0.9" />
            <path d="M 35,83 L 35,52 M 28,72 L 35,62 L 42,72" strokeWidth="0.9" />
            <line x1="15" y1="84" x2="185" y2="84" stroke="rgba(201,168,96,0.3)" />
          </svg>
        )}
      </div>
    </div>
  );
}
