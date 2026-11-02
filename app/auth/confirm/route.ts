import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
]);

function isEmailOtpType(value: string | null): value is EmailOtpType {
  if (!value) {
    return false;
  }
  return ALLOWED_OTP_TYPES.has(value as EmailOtpType);
}

function getSafeRedirectPath(nextParam: string | null): string {
  if (
    !nextParam ||
    !nextParam.startsWith("/") ||
    nextParam.startsWith("//") ||
    nextParam.startsWith("/login") ||
    nextParam.startsWith("/register")
  ) {
    return "/dashboard";
  }
  return nextParam;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.searchParams.delete("token_hash");
      redirectUrl.searchParams.delete("type");
      redirectUrl.searchParams.delete("next");
      return NextResponse.redirect(redirectUrl);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.searchParams.delete("code");
      redirectUrl.searchParams.delete("next");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const errorRedirectUrl = request.nextUrl.clone();
  errorRedirectUrl.pathname = "/login";
  errorRedirectUrl.search = "";
  errorRedirectUrl.searchParams.set("error", "verification_failed");
  return NextResponse.redirect(errorRedirectUrl);
}

