"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthClaims } from "@/lib/auth/session";
import {
  loginSchema,
  registerSchema,
  type AuthActionState,
  type AuthFieldErrors,
} from "@/lib/validations/auth";

function sanitizeRedirectPath(nextPath: string | null | undefined): string {
  if (
    !nextPath ||
    typeof nextPath !== "string" ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    nextPath.startsWith("/login") ||
    nextPath.startsWith("/register")
  ) {
    return "/dashboard";
  }
  return nextPath;
}

async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();
  const originHeader = headerStore.get("origin");
  if (originHeader && originHeader.startsWith("http")) {
    return originHeader.replace(/\/$/, "");
  }

  const forwardedHost =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "http";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

function mapSupabaseAuthError(
  code: string | undefined,
  message: string,
  status: number | undefined
): string {
  const normalizedCode = code?.toLowerCase() ?? "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedCode === "invalid_credentials" ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return "Invalid email or password. Please verify your credentials and try again.";
  }

  if (
    normalizedCode === "email_not_confirmed" ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "Your email address has not been verified yet. Please check your inbox for the confirmation link.";
  }

  if (
    status === 429 ||
    normalizedCode.includes("rate_limit") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("security purposes")
  ) {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  if (
    normalizedCode === "weak_password" ||
    normalizedMessage.includes("password should be")
  ) {
    return "The password provided does not meet the security requirements.";
  }

  return "Unable to complete authentication request. Please check your details and try again.";
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawNext = formData.get("next");

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const nextPath = sanitizeRedirectPath(
    typeof rawNext === "string" ? rawNext : null
  );

  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    const fieldErrors: AuthFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
      }
    }

    return {
      status: "error",
      message: "Please fix the validation errors below.",
      fieldErrors,
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: mapSupabaseAuthError(error.code, error.message, error.status),
      email: parsed.data.email,
    };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const confirmPassword =
    typeof rawConfirmPassword === "string" ? rawConfirmPassword : "";

  const parsed = registerSchema.safeParse({
    email,
    password,
    confirmPassword,
  });

  if (!parsed.success) {
    const fieldErrors: AuthFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "email" ||
        field === "password" ||
        field === "confirmPassword"
      ) {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
      }
    }

    return {
      status: "error",
      message: "Please correct the highlighted errors below.",
      fieldErrors,
      email,
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    const normalizedCode = error.code?.toLowerCase() ?? "";
    const normalizedMsg = error.message.toLowerCase();

    if (
      normalizedCode === "user_already_exists" ||
      normalizedCode === "email_exists" ||
      normalizedMsg.includes("already registered") ||
      normalizedMsg.includes("already exists")
    ) {
      return {
        status: "error",
        message:
          "An account with this email address already exists. Please sign in instead.",
        fieldErrors: {
          email: ["An account with this email address is already registered."],
        },
        email: parsed.data.email,
      };
    }

    return {
      status: "error",
      message: mapSupabaseAuthError(error.code, error.message, error.status),
      email: parsed.data.email,
    };
  }

  // When email confirmation is enabled, Supabase returns a user with an empty
  // `identities` array if the email address is already registered.
  if (
    data.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    return {
      status: "error",
      message:
        "An account with this email address already exists. Please sign in instead.",
      fieldErrors: {
        email: ["An account with this email address is already registered."],
      },
      email: parsed.data.email,
    };
  }

  // If email confirmation is disabled in Supabase, a session is returned immediately
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "We've sent a confirmation link to your email address. Please verify your email to activate your account.",
    email: parsed.data.email,
  };
}

export async function logoutAction(): Promise<void> {
  const claims = await getAuthClaims();
  const supabase = await createClient();

  if (claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
