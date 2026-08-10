import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { auth } from "@/auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApiUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "You must be signed in to do that.");
  }
  return session.user.id;
}

export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(422, firstZodMessage(parsed.error));
  }
  return parsed.data;
}

export function firstZodMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/**
 * Wraps a route handler, converting thrown ApiError/ZodError into safe JSON
 * responses without leaking stack traces or internal details.
 */
export function handle(
  fn: (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>,
) {
  return async (
    req: Request,
    ctx: { params: Record<string, string> },
  ): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: firstZodMessage(err) },
          { status: 422 },
        );
      }
      console.error("[api] unhandled error:", err);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}
