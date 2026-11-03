import type { JwtPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: string | undefined;
  claims: JwtPayload;
}

/**
 * Retrieves and validates the current user's JWT claims on the server
 * using Supabase SSR `getClaims()`.
 */
export async function getAuthClaims(): Promise<JwtPayload | null> {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return data.claims;
}

/**
 * Enforces authentication in Server Components, Server Actions, and data operations.
 * Redirects unauthenticated requests to `/login`.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const claims = await getAuthClaims();

  if (!claims || typeof claims.sub !== "string" || !claims.sub) {
    redirect("/login");
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    role: typeof claims.role === "string" ? claims.role : undefined,
    claims,
  };
}

/**
 * Redirects already-authenticated users away from guest-only pages (e.g., `/login`, `/register`).
 */
export async function redirectIfAuthenticated(
  destination = "/dashboard"
): Promise<void> {
  const claims = await getAuthClaims();

  if (claims && typeof claims.sub === "string" && claims.sub) {
    redirect(destination);
  }
}

