import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DocumentsList } from "@/components/documents/documents-list";

export const metadata = { title: "My Documents" };

export default async function MyDocumentsPage() {
  const user = await requireUser();
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      filename: true,
      fileType: true,
      fileSize: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="My Documents"
        description="All your uploaded and summarized documents."
        action={
          <Link href="/dashboard/documents/new" className={buttonVariants({ variant: "gradient" })}>
            <Plus className="size-4" /> New Document
          </Link>
        }
      />
      <DocumentsList
        initial={documents.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
