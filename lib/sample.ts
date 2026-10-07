export type Block = { kind: 'p'; text: string; cont?: boolean; noIndent?: boolean } | { kind: 'break' };

export function parseSample(text: string): Block[] {
  const blocks: Block[] = [];
  const raw = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const t of raw) {
    blocks.push({ kind: 'p', text: t.replace(/\s+/g, ' '), noIndent: true });
  }
  return blocks;
}

const cost = (b: Block) => (b.kind === 'break' ? 60 : b.text.length + 25);

/** Pack paragraphs into pages by an approximate character budget; long paragraphs split at sentence ends. */
export function paginate(blocks: Block[], budget: number, firstBudget = budget): Block[][] {
  const pages: Block[][] = [];
  let cur: Block[] = [];
  let used = 0;
  let cap = firstBudget;
  const push = () => {
    if (cur.length) pages.push(cur);
    cur = [];
    used = 0;
    cap = budget;
  };
  const queue = [...blocks];
  while (queue.length) {
    const b = queue.shift()!;
    const c = cost(b);
    if (used + c <= cap) {
      cur.push(b);
      used += c;
      continue;
    }
    if (b.kind === 'p') {
      const room = cap - used - 25;
      if (room > 15) {
        const parts = b.text.split(/([.!?]+[”"’']?\s*)/);
        const sentences = [];
        for (let i = 0; i < parts.length; i += 2) {
          if (parts[i]) sentences.push(parts[i] + (parts[i+1] || ''));
        }
        let head = '';
        while (sentences.length && (head + sentences[0]).length <= room) head += sentences.shift()!;
        if (head.trim()) {
          cur.push({ kind: 'p', text: head.trim(), cont: b.cont, noIndent: b.noIndent });
          queue.unshift({ kind: 'p', text: sentences.join('').trim(), cont: true });
          push();
          continue;
        }
        // If the first sentence alone exceeds room, split by words
        const words = b.text.split(/\s+/);
        let wordHead = '';
        while (words.length && (wordHead + (wordHead ? ' ' : '') + words[0]).length <= room) {
          wordHead += (wordHead ? ' ' : '') + words.shift()!;
        }
        if (wordHead.trim() && words.length) {
          cur.push({ kind: 'p', text: wordHead.trim(), cont: b.cont, noIndent: b.noIndent });
          queue.unshift({ kind: 'p', text: words.join(' ').trim(), cont: true });
          push();
          continue;
        }
      }
      if (!cur.length) {
        // A single paragraph larger than a page: hard split by words.
        const words = b.text.split(/\s+/);
        let head = '';
        while (words.length && (head + (head ? ' ' : '') + words[0]).length <= cap - 25) {
          head += (head ? ' ' : '') + words.shift()!;
        }
        cur.push({ kind: 'p', text: head.trim(), cont: b.cont, noIndent: b.noIndent });
        queue.unshift({ kind: 'p', text: words.join(' ').trim(), cont: true });
        push();
        continue;
      }
    }
    push();
    queue.unshift(b);
  }
  push();
  return pages;
}
