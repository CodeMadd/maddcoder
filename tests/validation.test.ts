import { describe, it, expect } from "vitest";
import {
  resumeContentSchema,
  createResumeSchema,
  emptyResumeContent,
} from "@/lib/validation/resume";
import { registerSchema } from "@/lib/validation/auth";
import { pasteTextSchema } from "@/lib/validation/document";
import { parseJSON } from "@/lib/ai/provider";
import { PLAN_LIMITS } from "@/lib/plans";

describe("resume validation", () => {
  it("fills defaults for an empty content object", () => {
    const c = emptyResumeContent();
    expect(c.experiences).toEqual([]);
    expect(c.personalInfo.fullName).toBe("");
    expect(c.skills.technical).toEqual([]);
  });

  it("accepts partial content and applies defaults", () => {
    const parsed = resumeContentSchema.parse({
      personalInfo: { fullName: "Jane" },
    });
    expect(parsed.personalInfo.fullName).toBe("Jane");
    expect(parsed.summary.text).toBe("");
  });

  it("rejects a resume without a name", () => {
    const res = createResumeSchema.safeParse({ template: "modern" });
    expect(res.success).toBe(false);
  });
});

describe("auth validation", () => {
  it("rejects short passwords", () => {
    const res = registerSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "short",
    });
    expect(res.success).toBe(false);
  });
});

describe("document validation", () => {
  it("requires non-empty pasted text", () => {
    expect(pasteTextSchema.safeParse({ text: "" }).success).toBe(false);
    expect(pasteTextSchema.safeParse({ text: "hello" }).success).toBe(true);
  });
});

describe("parseJSON", () => {
  it("parses JSON wrapped in code fences and prose", () => {
    const text = 'Here you go:\n```json\n{"a": 1, "b": [2,3]}\n```';
    expect(parseJSON<{ a: number; b: number[] }>(text)).toEqual({ a: 1, b: [2, 3] });
  });
});

describe("plan limits", () => {
  it("increase from FREE to PRO to BUSINESS", () => {
    expect(PLAN_LIMITS.FREE.aiGenerationsPerMonth).toBeLessThan(
      PLAN_LIMITS.PRO.aiGenerationsPerMonth,
    );
    expect(PLAN_LIMITS.PRO.aiGenerationsPerMonth).toBeLessThan(
      PLAN_LIMITS.BUSINESS.aiGenerationsPerMonth,
    );
    expect(PLAN_LIMITS.FREE.resumes).toBe(3);
    expect(PLAN_LIMITS.PRO.resumes).toBe(-1);
  });
});
