import type { DocumentSummary } from "@/lib/ai/services/document-ai";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function list(items: string[]): string {
  const filled = (items ?? []).filter(Boolean);
  if (!filled.length) return "<p class='muted'>None found.</p>";
  return `<ul>${filled.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

export function getSummaryHtml(
  filename: string,
  summary: DocumentSummary,
  generatedAt: Date = new Date(),
): string {
  const d = summary.importantDetails ?? {
    names: [],
    dates: [],
    numbers: [],
    deadlines: [],
  };
  const details = [
    d.dates?.length ? `<h3>Dates</h3>${list(d.dates)}` : "",
    d.numbers?.length ? `<h3>Numbers &amp; Figures</h3>${list(d.numbers)}` : "",
    d.deadlines?.length ? `<h3>Deadlines</h3>${list(d.deadlines)}` : "",
    d.names?.length ? `<h3>Names</h3>${list(d.names)}` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    @page{size:A4;margin:0}
    body{margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.55}
    .page{padding:18mm 16mm}
    h1{font-size:22px;margin:0 0 2px}
    .meta{color:#64748b;font-size:12px;margin-bottom:18px}
    h2{color:#6366f1;font-size:14px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-top:22px}
    h3{font-size:12px;margin:12px 0 4px;color:#334155}
    ul{margin:4px 0;padding-left:18px}
    li{margin:3px 0}
    .muted{color:#94a3b8}
    .disc{margin-top:24px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  </style></head><body><div class="page">
    <h1>${esc(filename)}</h1>
    <div class="meta">Generated ${esc(generatedAt.toLocaleString("en-US"))} · CareerAI</div>
    <h2>Executive Summary</h2><p>${esc(summary.executiveSummary)}</p>
    <h2>Key Points</h2>${list(summary.keyPoints)}
    <h2>Important Details</h2>${details || "<p class='muted'>None found.</p>"}
    <div class="disc">${esc(summary.disclaimer)}</div>
  </div></body></html>`;
}
