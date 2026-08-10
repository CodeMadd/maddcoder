import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Uses the edge-safe config (JWT session, no Prisma/bcrypt) so route
// protection runs in the middleware without pulling Node-only modules.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // The `authorized` callback in authConfig performs the redirect logic.
  return;
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
