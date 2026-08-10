// Prompt builders for resume AI features. Kept out of React components.
// Every prompt enforces the safety rules from the product spec: never
// fabricate jobs, degrees, certifications, skills, achievements, or metrics.

const SAFETY = `You are an expert resume writer. Absolute rules:
- Never invent companies, job titles, dates, degrees, certifications, skills, achievements, or metrics.
- Only rephrase or enhance the information the user actually provided.
- If a metric would strengthen a bullet but was not provided, do NOT invent a number.
- Optimize for action verbs, clarity, ATS keywords, and conciseness.`;

export function resumeSummaryPrompt(payload: unknown, variant: string) {
  return {
    system: SAFETY,
    user: `Write a concise professional summary (2-3 sentences). Variant intent: "${variant}".
Use only this candidate data. Respond as JSON: {"text": string}.
Data: ${JSON.stringify(payload)}`,
  };
}

export function improveExperiencePrompt(exp: unknown) {
  return {
    system: SAFETY,
    user: `Improve this work-experience entry into strong, ATS-friendly resume bullet points.
Respond as JSON: {"description": string, "bullets": string[]}.
Entry: ${JSON.stringify(exp)}`,
  };
}

export function generateBulletsPrompt(exp: unknown) {
  return {
    system: SAFETY,
    user: `Generate 3-5 achievement-oriented bullet points from this experience.
Respond as JSON: {"bullets": string[]}.
Experience: ${JSON.stringify(exp)}`,
  };
}

export function improveProjectPrompt(project: unknown) {
  return {
    system: SAFETY,
    user: `Rewrite this project description as a concise, professional resume bullet.
Respond as JSON: {"description": string}.
Project: ${JSON.stringify(project)}`,
  };
}

export function assistantCommandPrompt(command: string, text: string) {
  return {
    system: SAFETY,
    user: `Apply the instruction to the text below. Modify ONLY this text.
Instruction: "${command}"
Respond as JSON: {"result": string}.
Text: ${JSON.stringify(text)}`,
  };
}

export function suggestSkillsPrompt(payload: unknown) {
  return {
    system: SAFETY,
    user: `Suggest additional relevant skills that are clearly supported by the candidate's
experience below. Do NOT suggest skills the candidate has not demonstrated.
Respond as JSON: {"skills": string[]}.
Data: ${JSON.stringify(payload)}`,
  };
}

export function analyzeResumePrompt(content: unknown) {
  return {
    system: SAFETY,
    user: `Analyze this resume for ATS compatibility. Provide an estimated score (0-100)
and a per-category breakdown. Label it clearly as an AI estimate, not a real ATS.
Respond as JSON: {"overall": number, "breakdown": {"content": number, "keywords": number,
"formatting": number, "experience": number, "skills": number}, "issues": string[],
"suggestions": string[], "disclaimer": string}.
Resume: ${JSON.stringify(content)}`,
  };
}

export function matchJobPrompt(content: unknown, jobDescription: string) {
  return {
    system: SAFETY,
    user: `Compare the resume to the job description. Identify matching skills the candidate
already has, keywords present in the job description but missing from the resume, and
recommendations. Do NOT claim the candidate has skills they did not list.
Respond as JSON: {"matching": string[], "missing": string[], "recommendations": string[]}.
Resume: ${JSON.stringify(content)}
Job description: ${JSON.stringify(jobDescription)}`,
  };
}
