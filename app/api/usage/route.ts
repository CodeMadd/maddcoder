import { requireApiUser, handle, ok } from "@/lib/api";
import { getUsageSummary } from "@/lib/usage";

export const runtime = "nodejs";

export const GET = handle(async () => {
  const userId = await requireApiUser();
  const usage = await getUsageSummary(userId);
  return ok({ usage });
});
