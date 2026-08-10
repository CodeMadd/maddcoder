import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock";

const provider = new MockProvider();

async function run(task: string, payload: unknown) {
  const res = await provider.complete({
    json: true,
    messages: [],
    mock: { task, payload },
  });
  return JSON.parse(res.text);
}

const ACTION_VERB = /^(Led|Built|Developed|Designed|Implemented|Delivered|Improved|Optimized|Streamlined|Launched|Automated|Drove)\b/;

describe("mock resume AI", () => {
  it("improve_experience returns bullets starting with action verbs", async () => {
    const out = await run("improve_experience", {
      description: "worked on website development. helped with the checkout page.",
    });
    expect(out.bullets.length).toBeGreaterThan(0);
    expect(out.bullets[0]).toMatch(ACTION_VERB);
  });

  it("suggest_skills only returns skills supported by provided context", async () => {
    const out = await run("suggest_skills", {
      existing: [],
      context: "Built React apps with TypeScript and deployed to AWS.",
    });
    for (const skill of out.skills) {
      expect(["react", "typescript", "aws"]).toContain(skill.toLowerCase());
    }
    // Should NOT invent an unrelated skill.
    expect(out.skills.map((s: string) => s.toLowerCase())).not.toContain("figma");
  });

  it("analyze_resume returns a bounded score and an AI-estimate disclaimer", async () => {
    const out = await run("analyze_resume", {
      content: {
        summary: { text: "Experienced developer." },
        experiences: [{ description: "worked on things" }],
        skills: { technical: ["React", "TypeScript"] },
      },
    });
    expect(out.overall).toBeGreaterThanOrEqual(0);
    expect(out.overall).toBeLessThanOrEqual(100);
    expect(out.disclaimer.toLowerCase()).toContain("estimate");
  });
});
