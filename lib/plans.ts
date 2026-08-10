import { Plan } from "@prisma/client";

export type PlanLimits = {
  resumes: number; // -1 = unlimited
  documentsPerMonth: number;
  aiGenerationsPerMonth: number;
  maxDocumentBytes: number;
  templates: "basic" | "all";
  atsAnalysis: boolean;
  jobMatching: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    resumes: 3,
    documentsPerMonth: 5,
    aiGenerationsPerMonth: 10,
    maxDocumentBytes: 10 * 1024 * 1024,
    templates: "basic",
    atsAnalysis: false,
    jobMatching: false,
  },
  PRO: {
    resumes: -1,
    documentsPerMonth: 50,
    aiGenerationsPerMonth: 500,
    maxDocumentBytes: 25 * 1024 * 1024,
    templates: "all",
    atsAnalysis: true,
    jobMatching: true,
  },
  BUSINESS: {
    resumes: -1,
    documentsPerMonth: 500,
    aiGenerationsPerMonth: 5000,
    maxDocumentBytes: 50 * 1024 * 1024,
    templates: "all",
    atsAnalysis: true,
    jobMatching: true,
  },
};

export type PricingTier = {
  id: Plan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const PRICING: PricingTier[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started.",
    features: [
      "3 resumes",
      "5 document summaries / month",
      "10 AI generations / month",
      "Basic templates",
      "PDF export",
    ],
    cta: "Get started",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$12",
    period: "/ month",
    description: "For serious job seekers and professionals.",
    features: [
      "Unlimited resumes",
      "50 document summaries / month",
      "500 AI generations / month",
      "All templates",
      "ATS analysis",
      "Job description matching",
      "Priority PDF export",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "$39",
    period: "/ month",
    description: "For teams and power users.",
    features: [
      "Everything in Pro",
      "Higher AI limits",
      "Priority processing",
      "Team features",
      "Advanced analytics",
    ],
    cta: "Contact sales",
  },
];

export function planLabel(plan: Plan): string {
  return { FREE: "Free", PRO: "Pro", BUSINESS: "Business" }[plan];
}
