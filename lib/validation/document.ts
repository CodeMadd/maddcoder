import { z } from "zod";

export const SUMMARY_MODES = ["quick", "standard", "detailed"] as const;
export type SummaryMode = (typeof SUMMARY_MODES)[number];

export const SUPPORTED_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
} as const;

export const pasteTextSchema = z.object({
  filename: z.string().min(1).max(200).default("Pasted text"),
  text: z.string().min(1, "Text is required").max(1_000_000),
});

export const summarizeSchema = z.object({
  mode: z.enum(SUMMARY_MODES).default("standard"),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000),
});

export type SummarizeInput = z.infer<typeof summarizeSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
