import { requireApiUser, handle, ApiError } from "@/lib/api";
import { getOwnedDocument } from "@/lib/ownership";
import { getSummaryHtml } from "@/lib/pdf/summary-html";
import { htmlToPdf } from "@/lib/pdf/render";
import type { DocumentSummary } from "@/lib/ai/services/document-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

function summaryToText(filename: string, s: DocumentSummary): string {
  const d = s.importantDetails ?? { names: [], dates: [], numbers: [], deadlines: [] };
  const lines = [
    filename,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    "EXECUTIVE SUMMARY",
    s.executiveSummary,
    "",
    "KEY POINTS",
    ...s.keyPoints.map((k) => `- ${k}`),
    "",
    "IMPORTANT DETAILS",
    d.dates?.length ? `Dates: ${d.dates.join(", ")}` : "",
    d.numbers?.length ? `Numbers: ${d.numbers.join(", ")}` : "",
    d.deadlines?.length ? `Deadlines:\n${d.deadlines.map((x) => `- ${x}`).join("\n")}` : "",
    d.names?.length ? `Names: ${d.names.join(", ")}` : "",
    "",
    s.disclaimer,
  ];
  return lines.filter((l) => l !== "").join("\n");
}

export const GET = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  const document = await getOwnedDocument(userId, params.id);
  const format = new URL(req.url).searchParams.get("format") ?? "txt";

  if (!document.summary) {
    throw new ApiError(422, "Generate a summary before downloading.");
  }
  const summary = document.summary as unknown as DocumentSummary;
  const base = document.filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "_") || "summary";

  if (format === "pdf") {
    const pdf = await htmlToPdf(getSummaryHtml(document.filename, summary));
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${base}_summary.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(summaryToText(document.filename, summary), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}_summary.txt"`,
      "Cache-Control": "no-store",
    },
  });
});
