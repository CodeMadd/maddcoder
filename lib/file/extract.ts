import mammoth from "mammoth";
// Import the implementation directly to avoid pdf-parse's debug harness that
// runs when the package index is required without a parent module.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ExtractableType = "pdf" | "docx" | "txt";

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function extractText(
  buffer: Buffer,
  type: ExtractableType,
): Promise<string> {
  switch (type) {
    case "pdf": {
      const data = await pdfParse(buffer);
      return cleanText(data.text || "");
    }
    case "docx": {
      const { value } = await mammoth.extractRawText({ buffer });
      return cleanText(value || "");
    }
    case "txt": {
      return cleanText(buffer.toString("utf-8"));
    }
    default:
      throw new Error(`Unsupported file type: ${type as string}`);
  }
}
