import { describe, it, expect } from "vitest";
import { chunkText, retrieveRelevantChunks } from "@/lib/file/chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    expect(chunkText("hello world")).toEqual(["hello world"]);
  });

  it("returns empty array for empty text", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("splits long text into multiple bounded chunks", () => {
    const para = "This is a sentence about performance and reliability. ".repeat(50);
    const text = Array.from({ length: 6 }, () => para).join("\n\n");
    const chunks = chunkText(text, { maxChars: 1000, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      // Allow overlap slack but ensure roughly bounded.
      expect(c.length).toBeLessThanOrEqual(1000 + 300);
    }
  });
});

describe("retrieveRelevantChunks", () => {
  it("ranks chunks by query term overlap", () => {
    const chunks = [
      "The cat sat on the mat.",
      "Quarterly revenue increased by twenty percent this year.",
      "Weather patterns shifted in the spring.",
    ];
    const result = retrieveRelevantChunks(chunks, "What was the revenue?", 1);
    expect(result).toEqual([
      "Quarterly revenue increased by twenty percent this year.",
    ]);
  });

  it("returns all chunks when fewer than topK", () => {
    const chunks = ["a", "b"];
    expect(retrieveRelevantChunks(chunks, "anything", 3)).toEqual(chunks);
  });
});
