export type ChunkOptions = {
  maxChars?: number;
  overlap?: number;
};

/**
 * Split text into overlapping chunks on paragraph/sentence boundaries.
 * Used to avoid sending very large documents to the AI in a single request.
 */
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const maxChars = opts.maxChars ?? 6000;
  const overlap = opts.overlap ?? 300;
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // Prefer paragraph boundaries, fall back to sentence, then hard split.
  const paragraphs = clean.split(/\n{2,}/);
  const units: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      units.push(p);
    } else {
      const sentences = p.match(/[^.!?]+[.!?]+|\S+/g) ?? [p];
      let buf = "";
      for (const s of sentences) {
        if ((buf + s).length > maxChars) {
          if (buf) units.push(buf);
          buf = s;
        } else {
          buf += s;
        }
      }
      if (buf) units.push(buf);
    }
  }

  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (current && (current + "\n\n" + unit).length > maxChars) {
      chunks.push(current.trim());
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = tail + "\n\n" + unit;
    } else {
      current = current ? current + "\n\n" + unit : unit;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

/**
 * Lightweight lexical retrieval: score chunks by overlap with the query terms
 * and return the top matches. A pragmatic stand-in for vector search that
 * keeps document chat grounded in the source without external embeddings.
 */
export function retrieveRelevantChunks(
  chunks: string[],
  query: string,
  topK = 3,
): string[] {
  if (chunks.length <= topK) return chunks;
  const terms = tokenize(query);
  if (terms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map((chunk, index) => {
    const haystack = chunk.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const matches = haystack.split(term).length - 1;
      score += matches;
    }
    return { index, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .sort((a, b) => a.index - b.index)
    .map((s) => chunks[s.index]);
}

function tokenize(text: string): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is",
    "are", "was", "were", "what", "which", "how", "does", "do", "this",
    "that", "with", "about", "at", "by", "be", "it", "as",
  ]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2 && !stop.has(t)),
    ),
  );
}
