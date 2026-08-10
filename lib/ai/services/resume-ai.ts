import { getAIProvider, parseJSON, type CompletionRequest } from "@/lib/ai/provider";
import * as P from "@/lib/ai/prompts/resume";
import type { ResumeContent } from "@/lib/validation/resume";

type Run<T> = { data: T; tokensUsed: number };

async function run<T>(args: {
  system: string;
  user: string;
  task: string;
  payload: unknown;
  json?: boolean;
}): Promise<Run<T>> {
  const provider = getAIProvider();
  const req: CompletionRequest = {
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    json: args.json ?? true,
    mock: { task: args.task, payload: args.payload },
  };
  const res = await provider.complete(req);
  try {
    const data = (args.json === false ? (res.text as unknown) : parseJSON<T>(res.text)) as T;
    return { data, tokensUsed: res.tokensUsed };
  } catch {
    // Retry once, then surface a clean error.
    const retry = await provider.complete(req);
    const data = parseJSON<T>(retry.text);
    return { data, tokensUsed: retry.tokensUsed };
  }
}

function topSkills(content: Partial<ResumeContent>): string[] {
  const s = content.skills;
  if (!s) return [];
  return [...(s.technical ?? []), ...(s.frameworks ?? []), ...(s.tools ?? [])].slice(0, 6);
}

export function generateSummary(
  content: Partial<ResumeContent>,
  variant = "generate",
) {
  const payload = {
    personalInfo: content.personalInfo,
    summary: content.summary,
    topSkills: topSkills(content),
    variant,
  };
  const p = P.resumeSummaryPrompt(payload, variant);
  return run<{ text: string }>({
    system: p.system,
    user: p.user,
    task: "resume_summary",
    payload,
  });
}

export function improveExperience(exp: unknown) {
  const p = P.improveExperiencePrompt(exp);
  return run<{ description: string; bullets: string[] }>({
    system: p.system,
    user: p.user,
    task: "improve_experience",
    payload: exp,
  });
}

export function generateBullets(exp: unknown) {
  const p = P.generateBulletsPrompt(exp);
  return run<{ bullets: string[] }>({
    system: p.system,
    user: p.user,
    task: "generate_bullets",
    payload: exp,
  });
}

export function improveProject(project: unknown) {
  const p = P.improveProjectPrompt(project);
  return run<{ description: string }>({
    system: p.system,
    user: p.user,
    task: "improve_project",
    payload: project,
  });
}

export function runAssistant(command: string, text: string) {
  const p = P.assistantCommandPrompt(command, text);
  return run<{ result: string }>({
    system: p.system,
    user: p.user,
    task: "assistant_command",
    payload: { command, text },
  });
}

export function improveAchievement(title: string, description: string) {
  const p = P.assistantCommandPrompt("make this achievement stronger", description || title);
  return run<{ result: string }>({
    system: p.system,
    user: p.user,
    task: "improve_achievement",
    payload: { title, description },
  });
}

export function suggestSkills(content: Partial<ResumeContent>) {
  const context = JSON.stringify({
    experiences: content.experiences,
    projects: content.projects,
    summary: content.summary,
  });
  const payload = { existing: topSkills(content), context };
  const p = P.suggestSkillsPrompt(payload);
  return run<{ skills: string[] }>({
    system: p.system,
    user: p.user,
    task: "suggest_skills",
    payload,
  });
}

export type ResumeAnalysis = {
  overall: number;
  breakdown: {
    content: number;
    keywords: number;
    formatting: number;
    experience: number;
    skills: number;
  };
  issues: string[];
  suggestions: string[];
  disclaimer: string;
};

export function analyzeResume(content: unknown) {
  const p = P.analyzeResumePrompt(content);
  return run<ResumeAnalysis>({
    system: p.system,
    user: p.user,
    task: "analyze_resume",
    payload: { content },
  });
}

export type JobMatch = {
  matching: string[];
  missing: string[];
  recommendations: string[];
};

export function matchJob(content: unknown, jobDescription: string) {
  const p = P.matchJobPrompt(content, jobDescription);
  return run<JobMatch>({
    system: p.system,
    user: p.user,
    task: "match_job",
    payload: { content, jobDescription },
  });
}
