import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { checkUsageLimit } from "@/lib/usage";
import {
  createResumeSchema,
  emptyResumeContent,
} from "@/lib/validation/resume";

export const runtime = "nodejs";

export const GET = handle(async () => {
  const userId = await requireApiUser();
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return ok({ resumes });
});

export const POST = handle(async (req) => {
  const userId = await requireApiUser();
  const { name, template } = await parseBody(req, createResumeSchema);

  await checkUsageLimit(userId, "resume");

  const content = emptyResumeContent();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  // Seed the personal info with what we already know about the user.
  content.personalInfo.fullName = user?.name ?? "";
  content.personalInfo.email = user?.email ?? "";

  const resume = await prisma.resume.create({
    data: { userId, name, template, content },
  });
  return ok({ resume }, { status: 201 });
});
