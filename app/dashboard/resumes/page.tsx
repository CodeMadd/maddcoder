import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ResumesList } from "@/components/resume/resumes-list";

export const metadata = { title: "My Resumes" };

export default async function MyResumesPage() {
  const user = await requireUser();
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      template: true,
      atsScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="My Resumes"
        description="Manage all your resumes for different roles."
        action={
          <Link href="/dashboard/resumes/new" className={buttonVariants({ variant: "gradient" })}>
            <Plus className="size-4" /> Create Resume
          </Link>
        }
      />
      <ResumesList
        initial={resumes.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))}
      />
    </>
  );
}
