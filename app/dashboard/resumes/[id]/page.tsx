import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedResume } from "@/lib/ownership";
import { ApiError } from "@/lib/api";
import {
  resumeContentSchema,
  RESUME_TEMPLATES,
  type ResumeTemplate,
} from "@/lib/validation/resume";
import { ResumeBuilder } from "@/components/resume/resume-builder";

export default async function ResumeEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();

  let resume;
  try {
    resume = await getOwnedResume(user.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const content = resumeContentSchema.parse(resume.content);
  const template = (RESUME_TEMPLATES as readonly string[]).includes(
    resume.template,
  )
    ? (resume.template as ResumeTemplate)
    : "modern";

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <ResumeBuilder
        id={resume.id}
        initialName={resume.name}
        initialTemplate={template}
        initialContent={content}
      />
    </div>
  );
}
