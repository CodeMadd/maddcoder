import { z } from "zod";
import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ name: z.string().min(1).max(120) });

export const PATCH = handle(async (req) => {
  const userId = await requireApiUser();
  const { name } = await parseBody(req, schema);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true },
  });
  return ok({ user });
});
