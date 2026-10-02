export type Block = { kind: 'p'; text: string; cont?: boolean } | { kind: 'break' };

export function parseSample(text: string): Block[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (/^(\*\s*){3,}$|^#{1,}$|^~+$/.test(t) ? { kind: 'break' as const } : { kind: 'p' as const, text: t.replace(/\n/g, ' ') }));
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
      if (room > 60) {
        const sentences = b.text.match(/[^.!?”"]+[.!?]+[”"]?\s*|.+$/g) || [b.text];
        let head = '';
        while (sentences.length && (head + sentences[0]).length <= room) head += sentences.shift()!;
        if (head.trim()) {
          cur.push({ kind: 'p', text: head.trim(), cont: b.cont });
          queue.unshift({ kind: 'p', text: sentences.join('').trim(), cont: true });
          push();
          continue;
        }
        // If the first sentence alone exceeds room, split by words when room is sufficiently large
        if (room > 90) {
          const words = b.text.split(' ');
          let wordHead = '';
          while (words.length && (wordHead + (wordHead ? ' ' : '') + words[0]).length <= room) {
            wordHead += (wordHead ? ' ' : '') + words.shift()!;
          }
          if (wordHead.trim() && words.length) {
            cur.push({ kind: 'p', text: wordHead.trim(), cont: b.cont });
            queue.unshift({ kind: 'p', text: words.join(' ').trim(), cont: true });
            push();
            continue;
          }
        }
      }
      if (!cur.length) {
        // A single paragraph larger than a page: hard split by words.
        const words = b.text.split(' ');
        let head = '';
        while (words.length && (head + (head ? ' ' : '') + words[0]).length <= cap - 25) {
          head += (head ? ' ' : '') + words.shift()!;
        }
        cur.push({ kind: 'p', text: head.trim(), cont: b.cont });
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
