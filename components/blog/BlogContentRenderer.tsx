import React from 'react';

interface Props {
  content: string;
}

function renderInline(text: string): React.ReactNode {
  // Parses **bold**, *italic*, and [link](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check for bold **text**
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={`b-${keyIdx++}`} style={{ color: 'var(--cream)', fontWeight: 600 }}>
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for link [text](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith('http');
      parts.push(
        <a
          key={`l-${keyIdx++}`}
          href={linkMatch[2]}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Check for italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch && !italicMatch[2].includes(' ')) {
      parts.push(<em key={`i-${keyIdx++}`}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for code `code`
    const codeMatch = remaining.match(/^`(.*?)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: '0.9em',
            fontFamily: 'monospace',
            color: 'var(--gold)',
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Normal character or text before next special char
    const nextSpecial = remaining.search(/[\*_\[`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export default function BlogContentRenderer({ content }: Props) {
  if (!content) return null;

  // Split into raw paragraph blocks separated by 2 or more newlines
  const blocks = content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div
      className="blog-article-body"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        color: '#ded3c1',
        fontSize: 'clamp(16px, 1.2vw, 18px)',
        lineHeight: 1.85,
        fontFamily: 'var(--serif, Georgia, serif)',
      }}
    >
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // Heading 2
        if (trimmed.startsWith('## ')) {
          const h2Text = trimmed.replace(/^##\s+/, '');
          return (
            <h2
              key={idx}
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(24px, 2.8vw, 30px)',
                lineHeight: 1.3,
                color: 'var(--cream)',
                margin: '28px 0 6px',
                paddingBottom: 10,
                borderBottom: '1px solid rgba(201, 168, 96, 0.2)',
                letterSpacing: '-0.01em',
              }}
            >
              {renderInline(h2Text)}
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          const h3Text = trimmed.replace(/^###\s+/, '');
          return (
            <h3
              key={idx}
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(20px, 2.2vw, 24px)',
                lineHeight: 1.35,
                color: 'var(--gold)',
                margin: '20px 0 4px',
              }}
            >
              {renderInline(h3Text)}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith('>')) {
          const quoteText = trimmed.replace(/^>\s*/gm, '');
          return (
            <blockquote
              key={idx}
              style={{
                margin: '18px 0',
                padding: '18px 24px',
                borderLeft: '4px solid var(--gold)',
                background: 'rgba(201, 168, 96, 0.05)',
                borderRadius: '0 6px 6px 0',
                fontStyle: 'italic',
                color: '#eae2d5',
                fontSize: 'clamp(17px, 1.3vw, 19px)',
                lineHeight: 1.7,
              }}
            >
              {renderInline(quoteText)}
            </blockquote>
          );
        }

        // Unordered list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul
              key={idx}
              style={{
                margin: '8px 0',
                paddingLeft: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ lineHeight: 1.7 }}>
                  {renderInline(item.replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
          return (
            <ol
              key={idx}
              style={{
                margin: '8px 0',
                paddingLeft: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ lineHeight: 1.7 }}>
                  {renderInline(item.replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} style={{ margin: 0 }}>
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
