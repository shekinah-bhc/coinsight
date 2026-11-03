"use client";

import { useActionState, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import {
  loginSchema,
  initialAuthActionState,
  type AuthFieldErrors,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  nextPath?: string;
  callbackError?: string;
}

export function LoginForm({ nextPath, callbackError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialAuthActionState
  );
  const [clientErrors, setClientErrors] = useState<AuthFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const emailErrors = clientErrors.email ?? state.fieldErrors?.email;
  const passwordErrors = clientErrors.password ?? state.fieldErrors?.password;

  const callbackErrorMessage =
    callbackError === "verification_failed"
      ? "Your email verification link is invalid or has expired. Please sign in or register again."
      : undefined;

  const bannerMessage =
    Object.keys(clientErrors).length > 0
      ? "Please fix the highlighted fields before continuing."
      : state.status === "error"
        ? state.message
        : callbackErrorMessage;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      event.preventDefault();
      const nextFieldErrors: AuthFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          nextFieldErrors[field] = [
            ...(nextFieldErrors[field] ?? []),
            issue.message,
          ];
        }
      }
      setClientErrors(nextFieldErrors);
      return;
    }

    setClientErrors({});
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {bannerMessage ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{bannerMessage}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-xs font-medium text-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            defaultValue={state.email ?? ""}
            disabled={isPending}
            aria-invalid={Boolean(emailErrors?.length)}
            aria-describedby={
              emailErrors?.length ? "login-email-error" : undefined
            }
            onChange={() => {
              if (clientErrors.email) {
                setClientErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className="h-10 rounded-xl border-border bg-surface-secondary/60 pl-9 text-sm transition-colors focus-visible:border-primary focus-visible:ring-primary/25 md:text-sm dark:bg-white/[0.03]"
            required
          />
        </div>
        {emailErrors?.length ? (
          <p id="login-email-error" className="text-xs text-destructive">
            {emailErrors[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="text-xs font-medium text-foreground"
          >
            Password
          </Label>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isPending}
            aria-invalid={Boolean(passwordErrors?.length)}
            aria-describedby={
              passwordErrors?.length ? "login-password-error" : undefined
            }
            onChange={() => {
              if (clientErrors.password) {
                setClientErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            className="h-10 rounded-xl border-border bg-surface-secondary/60 pr-10 pl-9 text-sm transition-colors focus-visible:border-primary focus-visible:ring-primary/25 md:text-sm dark:bg-white/[0.03]"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isPending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordErrors?.length ? (
          <p id="login-password-error" className="text-xs text-destructive">
            {passwordErrors[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="mt-3 h-10 w-full gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign in to Coinsight</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
