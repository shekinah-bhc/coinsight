"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
} from "lucide-react";
import { registerAction } from "@/lib/auth/actions";
import {
  registerSchema,
  initialAuthActionState,
  type AuthFieldErrors,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialAuthActionState
  );
  const [clientErrors, setClientErrors] = useState<AuthFieldErrors>({});
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailErrors = clientErrors.email ?? state.fieldErrors?.email;
  const passwordErrors = clientErrors.password ?? state.fieldErrors?.password;
  const confirmPasswordErrors =
    clientErrors.confirmPassword ?? state.fieldErrors?.confirmPassword;

  const passwordChecks = [
    { label: "At least 8 characters", met: passwordValue.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(passwordValue) },
    { label: "One lowercase letter", met: /[a-z]/.test(passwordValue) },
    { label: "One number", met: /[0-9]/.test(passwordValue) },
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const parsed = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      event.preventDefault();
      const nextFieldErrors: AuthFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === "email" ||
          field === "password" ||
          field === "confirmPassword"
        ) {
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

  if (state.status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="space-y-5 py-2 text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-brand-secondary/30 bg-brand-secondary/10 text-brand-secondary">
          <MailCheck className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Verify your email address
          </h2>
          <p className="text-xs/relaxed text-muted-foreground">
            {state.message}
          </p>
          {state.email ? (
            <p className="pt-1 text-xs font-medium text-foreground">
              Sent to{" "}
              <span className="text-primary underline underline-offset-4">
                {state.email}
              </span>
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-surface-secondary/60 p-3.5 text-left text-xs text-muted-foreground dark:bg-white/[0.03]">
          Click the confirmation link in the email to complete verification and
          access your Coinsight dashboard.
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-surface-secondary/70 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-white/[0.04]"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  const bannerMessage =
    Object.keys(clientErrors).length > 0
      ? "Please resolve the validation errors highlighted below."
      : state.status === "error"
        ? state.message
        : undefined;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
    >
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
        <Label
          htmlFor="register-email"
          className="text-xs font-medium text-foreground"
        >
          Email address
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            defaultValue={state.email ?? ""}
            disabled={isPending}
            aria-invalid={Boolean(emailErrors?.length)}
            aria-describedby={
              emailErrors?.length ? "register-email-error" : undefined
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
          <p id="register-email-error" className="text-xs text-destructive">
            {emailErrors[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="register-password"
          className="text-xs font-medium text-foreground"
        >
          Password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={isPending}
            aria-invalid={Boolean(passwordErrors?.length)}
            aria-describedby="register-password-requirements"
            onChange={(e) => {
              setPasswordValue(e.target.value);
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
          <p id="register-password-error" className="text-xs text-destructive">
            {passwordErrors[0]}
          </p>
        ) : null}

        <ul
          id="register-password-requirements"
          aria-label="Password requirements"
          className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl border border-border/70 bg-surface-secondary/40 p-2.5 dark:bg-white/[0.02]"
        >
          {passwordChecks.map((check) => (
            <li
              key={check.label}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                check.met
                  ? "font-medium text-brand-secondary"
                  : "text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="register-confirm-password"
          className="text-xs font-medium text-foreground"
        >
          Confirm password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            disabled={isPending}
            aria-invalid={Boolean(confirmPasswordErrors?.length)}
            aria-describedby={
              confirmPasswordErrors?.length
                ? "register-confirm-password-error"
                : undefined
            }
            onChange={() => {
              if (clientErrors.confirmPassword) {
                setClientErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
            }}
            className="h-10 rounded-xl border-border bg-surface-secondary/60 pr-10 pl-9 text-sm transition-colors focus-visible:border-primary focus-visible:ring-primary/25 md:text-sm dark:bg-white/[0.03]"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isPending}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {confirmPasswordErrors?.length ? (
          <p
            id="register-confirm-password-error"
            className="text-xs text-destructive"
          >
            {confirmPasswordErrors[0]}
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
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create Coinsight account</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
