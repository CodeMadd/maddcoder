const DOC_SAFETY = `You are a precise document analyst. Absolute rules:
- Use ONLY information present in the provided document text.
- Never invent facts, numbers, names, dates, or conclusions.
- Do not alter numbers that appear in the source.
- If asked something the document does not answer, say the information could not be found.`;

export function documentSummaryPrompt(text: string, mode: string) {
  return {
    system: DOC_SAFETY,
    user: `Summarize the document below at "${mode}" depth.
Respond as JSON: {"executiveSummary": string, "keyPoints": string[],
"importantDetails": {"names": string[], "dates": string[], "numbers": string[],
"deadlines": string[]}, "questions": string[], "disclaimer": string}.
Document:
${text}`,
  };
}

export function documentChatPrompt(question: string, context: string) {
  return {
    system: DOC_SAFETY,
    user: `Answer the question using only the document context. If the answer is not in the
context, reply exactly: "This information could not be found in the uploaded document."
Respond as JSON: {"answer": string}.
Context:
${context}

Question: ${question}`,
  };
}
