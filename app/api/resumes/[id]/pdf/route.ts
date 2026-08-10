import { requireApiUser, handle, ApiError } from "@/lib/api";
import { getOwnedResume } from "@/lib/ownership";
import {
  resumeContentSchema,
  RESUME_TEMPLATES,
  type ResumeTemplate,
} from "@/lib/validation/resume";
import { getResumeHtml } from "@/lib/pdf/resume-html";
import { htmlToPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const resume = await getOwnedResume(userId, params.id);

  const content = resumeContentSchema.parse(resume.content);
  const template = (RESUME_TEMPLATES as readonly string[]).includes(
    resume.template,
  )
    ? (resume.template as ResumeTemplate)
    : "modern";

  const html = getResumeHtml(content, template);
  let pdf: Buffer;
  try {
    pdf = await htmlToPdf(html);
  } catch (err) {
    console.error("[pdf] render failed:", err);
    throw new ApiError(500, "Could not generate the PDF. Please try again.");
  }

  const safeName = resume.name.replace(/[^a-zA-Z0-9-_]+/g, "_") || "resume";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
