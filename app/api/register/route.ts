import bcrypt from "bcryptjs";
import { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { handle, parseBody, ok, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { name, email, password } = await parseBody(req, registerSchema);
  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalized,
      hashedPassword,
      subscription: { create: { plan: Plan.FREE } },
    },
    select: { id: true, email: true, name: true },
  });

  return ok({ user }, { status: 201 });
});
