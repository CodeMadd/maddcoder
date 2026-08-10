import { requireApiUser, handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  const userId = await requireApiUser();
  const { searchParams } = new URL(req.url);
  const take = Math.min(50, Number(searchParams.get("take") ?? 20));
  const skip = Math.max(0, Number(searchParams.get("skip") ?? 0));

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.document.count({ where: { userId } }),
  ]);

  return ok({ documents, total });
});
