import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock";

const provider = new MockProvider();

const DOC = `Quarterly Business Review Q3 2024.
Revenue for the quarter reached $4.2 million, an 18% increase.
The new dashboard launched on August 12, 2024.
A key vendor contract expires on December 31, 2024.`;

async function run(task: string, payload: unknown) {
  const res = await provider.complete({
    json: true,
    messages: [],
    mock: { task, payload },
  });
  return JSON.parse(res.text);
}

describe("mock document_summary (grounded extraction)", () => {
  it("extracts numbers and dates that appear in the source", async () => {
    const out = await run("document_summary", { text: DOC, mode: "standard" });
    expect(out.executiveSummary.length).toBeGreaterThan(0);
    expect(Array.isArray(out.keyPoints)).toBe(true);
    expect(out.importantDetails.numbers).toContain("$4.2 million");
    expect(out.importantDetails.numbers).toContain("18%");
    const dateStr = out.importantDetails.dates.join(" ");
    expect(dateStr).toMatch(/August 12/);
  });

  it("produces a disclaimer labeling it as extractive", async () => {
    const out = await run("document_summary", { text: DOC, mode: "quick" });
    expect(out.disclaimer.toLowerCase()).toContain("extractive");
  });
});

describe("mock document_chat (never hallucinates)", () => {
  it("answers from the document when the info is present", async () => {
    const out = await run("document_chat", {
      question: "What was the revenue?",
      context: DOC,
    });
    expect(out.answer.toLowerCase()).toContain("revenue");
  });

  it("says it cannot find info that is not in the document", async () => {
    const out = await run("document_chat", {
      question: "What is the CEO's favorite color?",
      context: DOC,
    });
    expect(out.answer).toBe(
      "This information could not be found in the uploaded document.",
    );
  });
});
