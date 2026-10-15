'use client';

import { useState } from 'react';
import type { BlogFAQItem } from '@/lib/types';

interface Props {
  faqs: BlogFAQItem[];
}

export default function BlogFaqAccordion({ faqs }: Props) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <section
      aria-label="Frequently Asked Questions"
      style={{
        marginTop: 56,
        paddingTop: 36,
        borderTop: '1px solid rgba(201, 168, 96, 0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--serif-c, "Cinzel", serif)' }}>
          Direct Answers & Research
        </span>
      </div>
      <h2
        style={{
          fontFamily: 'var(--serif, Georgia, serif)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          color: 'var(--cream)',
          margin: '0 0 24px',
          lineHeight: 1.3,
        }}
      >
        Frequently Asked Questions
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              style={{
                border: '1px solid rgba(201, 168, 96, 0.2)',
                borderRadius: 6,
                background: isOpen ? 'rgba(28, 23, 18, 0.7)' : 'rgba(20, 17, 14, 0.4)',
                overflow: 'hidden',
                transition: 'background 0.2s ease',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cream)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 16,
                  fontWeight: 600,
                  gap: 16,
                }}
              >
                <span>{faq.question}</span>
                <span
                  style={{
                    color: 'var(--gold)',
                    fontSize: 18,
                    fontWeight: 300,
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '0 20px 20px',
                    color: '#ded3c1',
                    fontSize: 15,
                    lineHeight: 1.7,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: 14,
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
