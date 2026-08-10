import { getAIProvider, parseJSON } from "@/lib/ai/provider";
import * as P from "@/lib/ai/prompts/document";
import { chunkText, retrieveRelevantChunks } from "@/lib/file/chunk";
import type { SummaryMode } from "@/lib/validation/document";

export type DocumentSummary = {
  executiveSummary: string;
  keyPoints: string[];
  importantDetails: {
    names: string[];
    dates: string[];
    numbers: string[];
    deadlines: string[];
  };
  questions: string[];
  disclaimer: string;
};

async function summarizeChunk(text: string, mode: SummaryMode) {
  const provider = getAIProvider();
  const p = P.documentSummaryPrompt(text, mode);
  const res = await provider.complete({
    system: p.system,
    messages: [{ role: "user", content: p.user }],
    json: true,
    mock: { task: "document_summary", payload: { text, mode } },
  });
  return { data: parseJSON<DocumentSummary>(res.text), tokensUsed: res.tokensUsed };
}

/**
 * Summarize a document with hierarchical summarization for large inputs:
 * chunk -> per-chunk summaries -> combined -> final summary. This avoids
 * sending an entire large document to the model in a single request.
 */
export async function summarizeDocument(
  text: string,
  mode: SummaryMode,
): Promise<{ data: DocumentSummary; tokensUsed: number }> {
  const chunks = chunkText(text, { maxChars: 6000, overlap: 300 });

  if (chunks.length <= 1) {
    return summarizeChunk(text, mode);
  }

  let tokensUsed = 0;
  const partials: string[] = [];
  for (const chunk of chunks) {
    const { data, tokensUsed: t } = await summarizeChunk(chunk, "quick");
    tokensUsed += t;
    partials.push(
      `${data.executiveSummary}\n${data.keyPoints.map((k) => `- ${k}`).join("\n")}`,
    );
  }

  const combined = partials.join("\n\n");
  const final = await summarizeChunk(combined, mode);
  return { data: final.data, tokensUsed: tokensUsed + final.tokensUsed };
}

export type ChatAnswer = { answer: string };

export async function chatWithDocument(
  question: string,
  fullText: string,
): Promise<{ data: ChatAnswer; tokensUsed: number }> {
  const chunks = chunkText(fullText, { maxChars: 4000, overlap: 200 });
  const relevant = retrieveRelevantChunks(chunks, question, 3);
  const context = (relevant.length ? relevant : chunks.slice(0, 2)).join("\n\n");

  const provider = getAIProvider();
  const p = P.documentChatPrompt(question, context);
  const res = await provider.complete({
    system: p.system,
    messages: [{ role: "user", content: p.user }],
    json: true,
    mock: { task: "document_chat", payload: { question, context } },
  });
  return { data: parseJSON<ChatAnswer>(res.text), tokensUsed: res.tokensUsed };
}
