/* eslint-disable @typescript-eslint/no-explicit-any */
// Task payloads are intentionally dynamic (shaped per task by the service
// layer), so `any` is used deliberately in this deterministic fallback.
import type {
  AIProvider,
  CompletionRequest,
  CompletionResult,
} from "@/lib/ai/provider";

// ---------------------------------------------------------------------------
// Deterministic, dependency-free AI fallback used for local development and in
// environments without an AI API key. It is intentionally *grounded*: document
// features are extractive (they never invent facts, numbers, or conclusions),
// and resume features rephrase the user's own input without fabricating
// achievements or metrics.
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  "Led", "Built", "Developed", "Designed", "Implemented", "Delivered",
  "Improved", "Optimized", "Streamlined", "Launched", "Automated", "Drove",
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "was", "were", "with", "as", "at", "by", "be", "it", "this", "that", "from",
  "we", "our", "their", "its", "has", "have", "had", "will", "which", "than",
  "then", "these", "those", "such", "also", "into", "over", "per", "not",
]);

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation only when followed by whitespace and
  // an opening/uppercase character. This avoids breaking on decimals like
  // "$4.2 million" or "18.5%". Newlines are treated as hard boundaries.
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    const norm = line.replace(/[ \t]+/g, " ").trim();
    if (!norm) continue;
    for (const part of norm.split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z])/)) {
      const s = part.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

function keywords(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const raw of text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    map.set(raw, (map.get(raw) ?? 0) + 1);
  }
  return map;
}

function topSentences(text: string, count: number): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= count) return sentences;
  const freq = keywords(text);
  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    let score = 0;
    for (const w of words) score += freq.get(w) ?? 0;
    // Normalise for length, lightly favour earlier sentences.
    score = score / Math.sqrt(words.length + 1) + (i < 3 ? 1.5 - i * 0.4 : 0);
    return { s, i, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

function capitalize(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function toBullet(sentence: string, seed: number): string {
  let s = sentence.trim().replace(/^[-•*]\s*/, "").replace(/[.]+$/, "");
  // Strip weak lead-ins so we can lead with a strong action verb instead.
  s = s.replace(
    /^(worked on|helped with|helped to|responsible for|assisted with|involved in|tasked with|participated in)\s+/i,
    "",
  );
  if (!s) return s;
  const startsWithVerb = ACTION_VERBS.some((v) =>
    s.toLowerCase().startsWith(v.toLowerCase()),
  );
  if (!startsWithVerb) {
    const lower = s.charAt(0).toLowerCase() + s.slice(1);
    s = `${pick(ACTION_VERBS, seed)} ${lower}`;
  } else {
    s = capitalize(s);
  }
  return s.endsWith(".") ? s : s + ".";
}

function generateBullets(description: string, count = 3): string[] {
  // Split into clauses on sentence/semicolon boundaries regardless of case so
  // each distinct statement becomes its own bullet.
  const clauses = description
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  const source = clauses.length ? clauses : splitSentences(description);
  const bullets = source.map((s, i) => toBullet(s, i + s.length));
  return bullets.slice(0, count);
}

// --- Extraction helpers for document details (grounded) --------------------

function extractDates(text: string): string[] {
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*\d{0,4}/gi,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  ];
  const found = new Set<string>();
  for (const p of patterns)
    for (const m of text.match(p) ?? []) found.add(m.trim());
  return Array.from(found).slice(0, 12);
}

function extractNumbers(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.match(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|k|m|bn))?/gi) ?? [])
    found.add(m.trim());
  for (const m of text.match(/\b\d+(?:\.\d+)?\s?%/g) ?? []) found.add(m.trim());
  return Array.from(found).slice(0, 12);
}

function extractDeadlines(text: string): string[] {
  return splitSentences(text)
    .filter((s) => /\b(deadline|due|no later than|by\s+\w+\s+\d|expires?)\b/i.test(s))
    .slice(0, 6);
}

function extractNames(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g) ?? []) {
    if (!/^(The|This|That|These|Those|A|An)\b/.test(m)) found.add(m);
  }
  return Array.from(found).slice(0, 10);
}

// --- Task implementations ---------------------------------------------------

function resumeSummary(payload: any): { text: string } {
  const p = payload ?? {};
  const info = p.personalInfo ?? {};
  const meta = p.summary ?? {};
  const variant: string = p.variant ?? "generate";
  const title =
    meta.targetJobTitle || info.title || "professional";
  const years = meta.yearsOfExperience;
  const skills: string[] = Array.isArray(p.topSkills) ? p.topSkills : [];
  const industry = meta.industry;

  const yearsPhrase = years ? `${years}+ years of experience ` : "";
  const industryPhrase = industry ? ` in the ${industry} industry` : "";
  const skillPhrase = skills.length
    ? ` with strengths in ${skills.slice(0, 4).join(", ")}`
    : "";

  let text =
    `${capitalize(title)} with ${yearsPhrase}delivering measurable results${industryPhrase}${skillPhrase}. ` +
    `Known for translating requirements into reliable solutions and collaborating across teams to ship high-quality work.`;

  if (variant === "shorten") {
    text = `${capitalize(title)}${years ? ` (${years}+ yrs)` : ""}${skillPhrase}. Focused on delivering reliable, high-quality results.`;
  } else if (variant === "professional") {
    text =
      `Results-oriented ${title.toLowerCase()} ${yearsPhrase}committed to operational excellence${industryPhrase}. ` +
      `Adept at aligning technical execution with business objectives${skillPhrase}.`;
  } else if (variant === "impactful") {
    text =
      `High-impact ${title.toLowerCase()} ${yearsPhrase}driving outcomes that move the needle${industryPhrase}. ` +
      `Consistently ${pick(["accelerates delivery", "raises quality", "unblocks teams"], title.length).toLowerCase()}${skillPhrase}.`;
  }
  return { text: text.replace(/\s+/g, " ").trim() };
}

function improveExperience(payload: any): {
  description: string;
  bullets: string[];
} {
  const desc: string = payload?.description ?? "";
  const bullets = generateBullets(desc, 4);
  const enhanced =
    bullets.length > 0
      ? bullets[0]
      : desc
        ? toBullet(desc, desc.length)
        : "";
  return { description: enhanced, bullets };
}

function improveText(payload: any): { result: string } {
  const text: string = payload?.text ?? "";
  const command: string = (payload?.command ?? "improve").toLowerCase();
  if (!text.trim()) return { result: "" };

  if (command.includes("concise")) {
    const first = splitSentences(text)[0] ?? text;
    return { result: capitalize(first.replace(/[.]+$/, "")) + "." };
  }
  if (command.includes("bullet")) {
    return { result: generateBullets(text, 4).map((b) => `• ${b}`).join("\n") };
  }
  if (command.includes("grammar") || command.includes("fix")) {
    return { result: splitSentences(text).map((s) => capitalize(s)).join(" ") };
  }
  // Default: rewrite professionally.
  return {
    result: generateBullets(text, 3).join(" ") || toBullet(text, text.length),
  };
}

function suggestSkills(payload: any): { skills: string[] } {
  const existing: string[] = (payload?.existing ?? []).map((s: string) =>
    s.toLowerCase(),
  );
  const context: string = payload?.context ?? "";
  const freq = keywords(context);
  const KNOWN = [
    "react", "typescript", "javascript", "node.js", "python", "postgresql",
    "aws", "docker", "kubernetes", "graphql", "next.js", "redis", "git",
    "ci/cd", "rest apis", "tailwind css", "java", "go", "sql", "figma",
    "communication", "leadership", "problem solving", "agile", "testing",
  ];
  const suggestions = KNOWN.filter((k) => {
    const base = k.split(/[ .\/]/)[0];
    return (freq.get(base) ?? 0) > 0 && !existing.includes(k);
  });
  // Only suggest skills supported by the user's provided context.
  return { skills: suggestions.slice(0, 8) };
}

function analyzeResume(payload: any): any {
  const content = payload?.content ?? {};
  const text = JSON.stringify(content).toLowerCase();
  const experiences = content.experiences ?? [];
  const skills = content.skills ?? {};
  const allSkills = [
    ...(skills.technical ?? []),
    ...(skills.tools ?? []),
    ...(skills.frameworks ?? []),
  ];
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!content.summary?.text) {
    issues.push("Missing professional summary.");
    suggestions.push("Add a concise 2–3 sentence professional summary.");
  }
  if (experiences.length === 0) {
    issues.push("No work experience listed.");
    suggestions.push("Add at least one work experience entry.");
  }
  if (allSkills.length < 5) {
    issues.push("Few skills listed.");
    suggestions.push("List relevant technical and soft skills as keywords.");
  }
  const hasWeakVerbs = /\b(worked on|responsible for|helped with)\b/.test(text);
  if (hasWeakVerbs) {
    issues.push("Weak action verbs detected (e.g. 'worked on').");
    suggestions.push("Replace weak verbs with strong ones like 'Led' or 'Built'.");
  }

  const contentScore = Math.max(50, 95 - issues.length * 8);
  const keywordsScore = Math.min(95, 60 + allSkills.length * 3);
  const formattingScore = 92;
  const experienceScore = Math.min(95, 60 + experiences.length * 10);
  const skillsScore = Math.min(95, 55 + allSkills.length * 4);
  const overall = Math.round(
    (contentScore + keywordsScore + formattingScore + experienceScore + skillsScore) /
      5,
  );

  return {
    overall,
    breakdown: {
      content: contentScore,
      keywords: keywordsScore,
      formatting: formattingScore,
      experience: experienceScore,
      skills: skillsScore,
    },
    issues,
    suggestions,
    disclaimer:
      "This is an AI-based estimate and does not reflect any specific ATS system's exact scoring.",
  };
}

function matchJob(payload: any): any {
  const content = payload?.content ?? {};
  const jd: string = (payload?.jobDescription ?? "").toLowerCase();
  const jdWords = new Set(
    jd.replace(/[^a-z0-9+.#\s]/g, " ").split(/\s+/).filter((w) => w.length > 2),
  );
  const skills = content.skills ?? {};
  const resumeSkills: string[] = [
    ...(skills.technical ?? []),
    ...(skills.tools ?? []),
    ...(skills.frameworks ?? []),
    ...(skills.languages ?? []),
  ];
  const matching = resumeSkills.filter((s) =>
    jdWords.has(s.toLowerCase().split(/[ .\/]/)[0]),
  );
  const COMMON = [
    "react", "typescript", "javascript", "node", "python", "aws", "docker",
    "kubernetes", "sql", "postgresql", "graphql", "ci/cd", "rest", "agile",
    "testing", "git", "java", "go",
  ];
  const have = new Set(resumeSkills.map((s) => s.toLowerCase().split(/[ .\/]/)[0]));
  const missing = COMMON.filter(
    (k) => jdWords.has(k) && !have.has(k),
  );
  const recommendations = [
    matching.length
      ? `Emphasize your matching skills (${matching.slice(0, 5).join(", ")}) near the top of your resume.`
      : "Mirror the exact keywords used in the job description where they genuinely apply to you.",
    missing.length
      ? `The role mentions ${missing.slice(0, 5).join(", ")}. Only add these if you actually have the experience.`
      : "Your keyword coverage looks strong for this role.",
    "Quantify achievements with real metrics you can support.",
  ];
  return { matching, missing, recommendations };
}

function documentSummary(payload: any): any {
  const text: string = payload?.text ?? "";
  const mode: string = payload?.mode ?? "standard";
  const summaryLen = mode === "quick" ? 2 : mode === "detailed" ? 5 : 3;
  const pointsLen = mode === "quick" ? 3 : mode === "detailed" ? 8 : 5;

  const executiveSummary = topSentences(text, summaryLen).join(" ");
  const keyPoints = topSentences(text, pointsLen);

  const dates = extractDates(text);
  const numbers = extractNumbers(text);
  const names = extractNames(text);
  const deadlines = extractDeadlines(text);

  const questions = [
    "What is the main objective of this document?",
    dates.length ? "What dates or deadlines are mentioned?" : null,
    numbers.length ? "What key figures or financials are stated?" : null,
    "What are the most important conclusions or recommendations?",
  ].filter(Boolean) as string[];

  return {
    executiveSummary:
      executiveSummary || "The document did not contain extractable text.",
    keyPoints,
    importantDetails: { names, dates, numbers, deadlines },
    questions,
    disclaimer:
      "Summary generated by extractive analysis of the source document. Only information present in the document is included.",
  };
}

function documentChat(payload: any): { answer: string } {
  const question: string = payload?.question ?? "";
  const context: string = payload?.context ?? "";
  const qTerms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  const sentences = splitSentences(context);
  const scored = sentences
    .map((s) => {
      const lower = s.toLowerCase();
      const score = qTerms.reduce(
        (acc, t) => acc + (lower.includes(t) ? 1 : 0),
        0,
      );
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return {
      answer: "This information could not be found in the uploaded document.",
    };
  }
  return {
    answer:
      "Based on the document: " +
      scored
        .sort()
        .map((x) => x.s.replace(/\s+/g, " ").trim())
        .join(" "),
  };
}

const TASKS: Record<string, (payload: any) => unknown> = {
  resume_summary: resumeSummary,
  improve_experience: improveExperience,
  generate_bullets: (p) => ({ bullets: generateBullets(p?.description ?? "", 4) }),
  improve_project: (p) => ({
    description: generateBullets(p?.description ?? "", 2).join(" ") ||
      toBullet(p?.description ?? "", (p?.description ?? "").length),
  }),
  improve_achievement: (p) => improveText({ text: p?.description ?? p?.title ?? "", command: "professional" }),
  assistant_command: improveText,
  suggest_skills: suggestSkills,
  analyze_resume: analyzeResume,
  match_job: matchJob,
  document_summary: documentSummary,
  document_chat: documentChat,
};

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const task = req.mock?.task;
    const payload = req.mock?.payload as any;

    if (task && TASKS[task]) {
      const result = TASKS[task](payload);
      const text = req.json === false
        ? String((result as { text?: string }).text ?? result)
        : JSON.stringify(result);
      return { text, tokensUsed: Math.round(text.length / 4) };
    }

    // Generic echo-style fallback for unspecified tasks.
    const last = req.messages[req.messages.length - 1]?.content ?? "";
    return {
      text: req.json ? JSON.stringify({ result: last }) : last,
      tokensUsed: Math.round(last.length / 4),
    };
  }
}
