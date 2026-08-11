import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ensureDemoData } from "@/lib/demo";
import { DEMO_EMAIL } from "@/lib/demo-constants";

export const runtime = "nodejs";

// Public: ensures the shared demo account exists so the one-click demo works
// even on a fresh database. Idempotent and only touches the demo account.
export const POST = handle(async () => {
  await ensureDemoData(prisma);
  return ok({ email: DEMO_EMAIL });
});
