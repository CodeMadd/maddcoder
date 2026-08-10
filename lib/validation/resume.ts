import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z.string().max(120).default(""),
  title: z.string().max(120).default(""),
  email: z.string().max(160).default(""),
  phone: z.string().max(60).default(""),
  location: z.string().max(120).default(""),
  website: z.string().max(200).default(""),
  linkedin: z.string().max(200).default(""),
  github: z.string().max(200).default(""),
  photoUrl: z.string().max(500).default(""),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().max(160).default(""),
  jobTitle: z.string().max(160).default(""),
  location: z.string().max(120).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  current: z.boolean().default(false),
  description: z.string().max(4000).default(""),
  achievements: z.array(z.string().max(500)).default([]),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string().max(160).default(""),
  degree: z.string().max(160).default(""),
  field: z.string().max(160).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  gpa: z.string().max(40).default(""),
  description: z.string().max(2000).default(""),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().max(160).default(""),
  description: z.string().max(2000).default(""),
  technologies: z.array(z.string().max(60)).default([]),
  url: z.string().max(200).default(""),
  githubUrl: z.string().max(200).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().max(160).default(""),
  organization: z.string().max(160).default(""),
  issueDate: z.string().max(40).default(""),
  expirationDate: z.string().max(40).default(""),
  credentialId: z.string().max(120).default(""),
  credentialUrl: z.string().max(200).default(""),
});

export const languageSchema = z.object({
  id: z.string(),
  language: z.string().max(80).default(""),
  proficiency: z.string().max(60).default(""),
});

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string().max(160).default(""),
  description: z.string().max(1000).default(""),
  date: z.string().max(40).default(""),
});

export const skillsSchema = z.object({
  technical: z.array(z.string().max(60)).default([]),
  soft: z.array(z.string().max(60)).default([]),
  tools: z.array(z.string().max(60)).default([]),
  frameworks: z.array(z.string().max(60)).default([]),
  languages: z.array(z.string().max(60)).default([]),
});

export const summaryMetaSchema = z.object({
  text: z.string().max(3000).default(""),
  yearsOfExperience: z.string().max(20).default(""),
  targetJobTitle: z.string().max(120).default(""),
  industry: z.string().max(120).default(""),
});

export const RESUME_TEMPLATES = [
  "minimal",
  "modern",
  "professional",
  "executive",
  "technical",
] as const;

export const resumeContentSchema = z.object({
  personalInfo: personalInfoSchema.default({}),
  summary: summaryMetaSchema.default({}),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: skillsSchema.default({}),
  projects: z.array(projectSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
});

export const createResumeSchema = z.object({
  name: z.string().min(1).max(120),
  template: z.enum(RESUME_TEMPLATES).default("modern"),
});

export const updateResumeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  template: z.enum(RESUME_TEMPLATES).optional(),
  content: resumeContentSchema.optional(),
  atsScore: z.number().int().min(0).max(100).nullable().optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type SummaryMeta = z.infer<typeof summaryMetaSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number];

export function emptyResumeContent(): ResumeContent {
  return resumeContentSchema.parse({});
}
