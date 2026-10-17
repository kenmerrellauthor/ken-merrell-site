import React from 'react';
import InArticleAdSlot from '@/components/ads/InArticleAdSlot';
import type { InArticleAdItem } from '@/lib/types';

interface Props {
  content: string;
  inArticleAd?: InArticleAdItem | null;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Check for bold-italic ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      parts.push(
        <strong key={`bi-${keyIdx++}`} style={{ color: 'var(--cream)', fontWeight: 700 }}>
          <em>{boldItalicMatch[2]}</em>
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 2. Check for bold **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={`b-${keyIdx++}`} style={{ color: 'var(--cream)', fontWeight: 600 }}>
          {renderInline(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Check for link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const href = linkMatch[2].trim();
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      parts.push(
        <a
          key={`l-${keyIdx++}`}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          style={{
            color: 'var(--gold, #c9a860)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            transition: 'opacity 0.2s',
          }}
        >
          {renderInline(linkMatch[1])}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 4. Check for italic *text* or _text_ (supports multiple words with spaces)
    const italicMatch = remaining.match(/^(\*|_)([^\*_]+?)\1/);
    if (italicMatch) {
      parts.push(
        <em key={`i-${keyIdx++}`} style={{ fontStyle: 'italic', color: '#eae2d5' }}>
          {renderInline(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 5. Check for strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      parts.push(
        <del key={`s-${keyIdx++}`} style={{ opacity: 0.7 }}>
          {renderInline(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 6. Check for inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: '0.88em',
            fontFamily: 'monospace',
            color: 'var(--gold, #c9a860)',
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 7. Check for raw HTML tags (e.g. <b>, <strong>, <i>, <em>, <a>, <br>)
    const htmlBreak = remaining.match(/^<br\s*\/?>/i);
    if (htmlBreak) {
      parts.push(<br key={`br-${keyIdx++}`} />);
      remaining = remaining.slice(htmlBreak[0].length);
      continue;
    }

    const htmlBold = remaining.match(/^<(b|strong)>(.*?)<\/\1>/i);
    if (htmlBold) {
      parts.push(
        <strong key={`hb-${keyIdx++}`} style={{ color: 'var(--cream)', fontWeight: 600 }}>
          {renderInline(htmlBold[2])}
        </strong>
      );
      remaining = remaining.slice(htmlBold[0].length);
      continue;
    }

    const htmlItalic = remaining.match(/^<(i|em)>(.*?)<\/\1>/i);
    if (htmlItalic) {
      parts.push(
        <em key={`hi-${keyIdx++}`} style={{ fontStyle: 'italic', color: '#eae2d5' }}>
          {renderInline(htmlItalic[2])}
        </em>
      );
      remaining = remaining.slice(htmlItalic[0].length);
      continue;
    }

    const htmlLink = remaining.match(/^<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
    if (htmlLink) {
      const isExternal = htmlLink[1].startsWith('http');
      parts.push(
        <a
          key={`hl-${keyIdx++}`}
          href={htmlLink[1]}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          style={{ color: 'var(--gold, #c9a860)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          {renderInline(htmlLink[2])}
        </a>
      );
      remaining = remaining.slice(htmlLink[0].length);
      continue;
    }

    // 8. Normal text before next special character
    const nextSpecial = remaining.search(/[\*_\[`~<]/);
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

import { parseYouTubeId } from '@/lib/youtube';

type ParsedBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'video'; youtubeId: string; title?: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'hr' }
  | { type: 'ad' }
  | { type: 'p'; lines: string[] };

function parseMarkdownBlocks(content: string): ParsedBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // In-Article Ad shortcode: [ad], [advertisement], or [sponsored]
    if (/^\[(ad|advertisement|sponsored)\]$/i.test(trimmed)) {
      blocks.push({ type: 'ad' });
      i++;
      continue;
    }

    // Video Embed (YouTube URL on its own line or [video](https://...) or [video: Title](https://...))
    const videoMarkdown = trimmed.match(/^\[(?:video|youtube)(?::\s*(.*?))?\]\((https?:\/\/[^\s)]+)\)/i);
    const ytId = videoMarkdown ? parseYouTubeId(videoMarkdown[2]) : parseYouTubeId(trimmed);
    if (ytId && (videoMarkdown || /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed))) {
      blocks.push({
        type: 'video',
        youtubeId: ytId,
        title: videoMarkdown?.[1]?.trim() || undefined,
      });
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading 1
    if (/^#\s+/.test(trimmed)) {
      blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
      i++;
      continue;
    }

    // Heading 2 (## or <h2>)
    if (/^##\s+/.test(trimmed) || /^<h2>(.*?)<\/h2>$/i.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, '').replace(/^<h2>|<\/h2>$/gi, '');
      blocks.push({ type: 'h2', text });
      i++;
      continue;
    }

    // Heading 3 (### or <h3>)
    if (/^###\s+/.test(trimmed) || /^<h3>(.*?)<\/h3>$/i.test(trimmed)) {
      const text = trimmed.replace(/^###\s+/, '').replace(/^<h3>|<\/h3>$/gi, '');
      blocks.push({ type: 'h3', text });
      i++;
      continue;
    }

    // Heading 4 (#### or <h4>)
    if (/^####\s+/.test(trimmed) || /^<h4>(.*?)<\/h4>$/i.test(trimmed)) {
      const text = trimmed.replace(/^####\s+/, '').replace(/^<h4>|<\/h4>$/gi, '');
      blocks.push({ type: 'h4', text });
      i++;
      continue;
    }

    // Blockquote (> ...)
    if (/^>\s*/.test(trimmed) || /^<blockquote>/i.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('>') || /^<blockquote>/i.test(lines[i].trim()))) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, '').replace(/<\/?blockquote>/gi, ''));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines.filter(Boolean) });
      continue;
    }

    // Unordered List (- item or * item)
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List (1. item or 1) item)
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Regular Paragraph lines (accumulate until next block or blank line)
    const pLines: string[] = [rawLine];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s+/.test(lines[i].trim()) &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !/^(---|___|\*\*\*)$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', lines: pLines });
  }

  return blocks;
}

export default function BlogContentRenderer({ content, inArticleAd }: Props) {
  if (!content) return null;

  const rawBlocks = parseMarkdownBlocks(content);
  const blocks = [...rawBlocks];

  // If in-article ad is enabled and no explicit [ad] block was typed, automatically inject
  // at start, mid, or end of article (default: mid)
  const isAdEnabled = Boolean(inArticleAd && inArticleAd.enabled !== false);
  const hasManualAd = blocks.some((b) => b.type === 'ad');

  if (isAdEnabled && !hasManualAd) {
    const pIndices: number[] = [];
    blocks.forEach((b, idx) => {
      if (b.type === 'p') pIndices.push(idx);
    });

    const totalParagraphs = pIndices.length;
    let insertIdx = -1;

    const placement = inArticleAd?.placement || 
      (inArticleAd?.insertAfterParagraph === 1 ? 'start' :
       inArticleAd?.insertAfterParagraph && inArticleAd.insertAfterParagraph >= 4 ? 'end' : 'mid');

    if (totalParagraphs > 0) {
      if (placement === 'start') {
        // Start of article: after paragraph 1
        insertIdx = pIndices[0] + 1;
      } else if (placement === 'end') {
        // End of article: before conclusion / after second-to-last paragraph
        const targetP = totalParagraphs > 2 ? totalParagraphs - 1 : totalParagraphs;
        insertIdx = pIndices[targetP - 1] + 1;
      } else {
        // Mid of article (Recommended): right in the middle
        const midP = Math.max(1, Math.ceil(totalParagraphs / 2));
        insertIdx = pIndices[midP - 1] + 1;
      }
    }

    if (insertIdx !== -1) {
      blocks.splice(insertIdx, 0, { type: 'ad' });
    }
  }

  return (
    <div
      className="blog-article-body"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: '#ded3c1',
        fontSize: 'clamp(16px, 1.2vw, 18px)',
        lineHeight: 1.85,
        fontFamily: 'var(--serif, Georgia, serif)',
      }}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                style={{
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 'clamp(28px, 3.2vw, 36px)',
                  lineHeight: 1.25,
                  color: 'var(--cream, #fdfbf7)',
                  margin: '32px 0 8px',
                  letterSpacing: '-0.01em',
                }}
              >
                {renderInline(block.text)}
              </h1>
            );

          case 'h2':
            return (
              <h2
                key={idx}
                style={{
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 'clamp(24px, 2.6vw, 30px)',
                  lineHeight: 1.3,
                  color: 'var(--cream, #fdfbf7)',
                  margin: '28px 0 6px',
                  paddingBottom: 10,
                  borderBottom: '1px solid rgba(201, 168, 96, 0.22)',
                  letterSpacing: '-0.01em',
                }}
              >
                {renderInline(block.text)}
              </h2>
            );

          case 'h3':
            return (
              <h3
                key={idx}
                style={{
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 'clamp(20px, 2.1vw, 23px)',
                  lineHeight: 1.35,
                  color: 'var(--gold, #c9a860)',
                  margin: '20px 0 4px',
                  fontWeight: 600,
                }}
              >
                {renderInline(block.text)}
              </h3>
            );

          case 'h4':
            return (
              <h4
                key={idx}
                style={{
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 'clamp(17px, 1.6vw, 19px)',
                  lineHeight: 1.4,
                  color: 'var(--cream, #fdfbf7)',
                  margin: '16px 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {renderInline(block.text)}
              </h4>
            );

          case 'video':
            return (
              <div
                key={idx}
                style={{
                  margin: '28px 0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(201, 168, 96, 0.35)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                  background: '#0a0908',
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}`}
                    title={block.title || 'Video Player'}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                {block.title && (
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 12,
                      color: 'var(--gold, #c9a860)',
                      background: 'rgba(20, 16, 12, 0.95)',
                      borderTop: '1px solid rgba(201, 168, 96, 0.18)',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>▶</span>
                    <span>{block.title}</span>
                  </div>
                )}
              </div>
            );

          case 'quote':
            return (
              <blockquote
                key={idx}
                style={{
                  margin: '18px 0',
                  padding: '18px 24px',
                  borderLeft: '4px solid var(--gold, #c9a860)',
                  background: 'rgba(201, 168, 96, 0.06)',
                  borderRadius: '0 6px 6px 0',
                  fontStyle: 'italic',
                  color: '#eae2d5',
                  fontSize: 'clamp(17px, 1.3vw, 19px)',
                  lineHeight: 1.7,
                }}
              >
                {block.lines.map((l, lIdx) => (
                  <p key={lIdx} style={{ margin: lIdx === 0 ? 0 : '8px 0 0' }}>
                    {renderInline(l)}
                  </p>
                ))}
              </blockquote>
            );

          case 'ul':
            return (
              <ul
                key={idx}
                style={{
                  margin: '8px 0',
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  listStyleType: 'disc',
                }}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ lineHeight: 1.75, color: '#ded3c1' }}>
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol
                key={idx}
                style={{
                  margin: '8px 0',
                  paddingLeft: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  listStyleType: 'decimal',
                }}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ lineHeight: 1.75, color: '#ded3c1' }}>
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );

          case 'hr':
            return (
              <hr
                key={idx}
                style={{
                  border: 'none',
                  borderTop: '1px solid rgba(201, 168, 96, 0.25)',
                  margin: '28px 0',
                }}
              />
            );

          case 'ad':
            if (!isAdEnabled || !inArticleAd) return null;
            return <InArticleAdSlot key={idx} adConfig={inArticleAd} />;

          case 'p':
          default:
            return (
              <p key={idx} style={{ margin: 0 }}>
                {block.lines.map((l, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {renderInline(l)}
                    {lIdx < block.lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
