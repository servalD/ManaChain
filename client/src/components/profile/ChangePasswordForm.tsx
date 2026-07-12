"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearSession, useResetPassword, useChangePassword } from "@/hooks/api/useAuth";
import { Button } from "@/components/ui/button";
import { getPasswordCriteria, isValidPassword } from "@/utils/validation";
import { Lock, ArrowLeft } from "lucide-react";

const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";

export interface ChangePasswordFormProps {
  /** When set, form is in "reset password" mode (from email link). When null, "change password" (from profile, user is authenticated). */
  resetToken: string | null;
  /** Custom redirect path after successful password change. Defaults to /profile for change flow, /login for reset flow. */
  redirectTo?: string;
  /** Custom title for the form (e.g. for first-login required flow). */
  title?: string;
  /** Custom description for the form. */
  description?: string;
  /** Hide the back link (e.g. when password change is required before accessing dashboard). */
  hideBackLink?: boolean;
}

export function ChangePasswordForm({ resetToken, redirectTo, title, description, hideBackLink }: ChangePasswordFormProps) {
  const router = useRouter();
  const isResetFlow = !!resetToken;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetPassword = useResetPassword();
  const changePassword = useChangePassword();

  const criteria = getPasswordCriteria(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword || (!isResetFlow && !currentPassword)) {
      setError("Please fill in both fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const validation = isValidPassword(newPassword);
    if (!validation.valid) {
      setError(validation.error || "Invalid password.");
      return;
    }

    setIsSubmitting(true);
    if (isResetFlow && resetToken) {
      resetPassword.mutate(
        { data: { token: resetToken, newPassword } },
        {
          onSuccess: () => router.push(redirectTo ?? "/login"),
          onSettled: () => setIsSubmitting(false),
        }
      );
    } else {
      changePassword.mutate(
        { data: { currentPassword, newPassword } },
        {
          // Le back révoque tous les refresh tokens actifs au changement de
          // mot de passe. Sans `redirectTo` explicite (flux profil "standard"),
          // on force la reconnexion (le JWT courant reste valide jusqu'à son
          // expiration, mais son refresh silencieux ne fonctionnera plus).
          // Un `redirectTo` explicite (ex. onboarding marque) garde le flux
          // existant : la session en cours n'est pas coupée.
          onSuccess: () => {
            if (!redirectTo) clearSession();
            router.push(redirectTo ?? "/login");
          },
          onSettled: () => setIsSubmitting(false),
        }
      );
    }
  };

  return (
    <div className="pt-30 sm:pt-30 pb-8 sm:pb-12 px-4 sm:px-6 md:px-8 w-full">
      <div className="w-full max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              {title ?? (isResetFlow ? "Reset password" : "Change password")}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {description ?? (isResetFlow
              ? "Enter your new password below."
              : "Update your password. You will need to sign in again with the new password if you change it.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetFlow && (
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClassName}
                placeholder="Current password"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClassName}
              placeholder="New password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <ul className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
              <li className={criteria.length ? "text-green-600 dark:text-green-400" : ""}>
                {criteria.length ? "✓" : "○"} At least 12 characters
              </li>
              <li className={criteria.digit ? "text-green-600 dark:text-green-400" : ""}>
                {criteria.digit ? "✓" : "○"} At least one digit
              </li>
              <li className={criteria.special ? "text-green-600 dark:text-green-400" : ""}>
                {criteria.special ? "✓" : "○"} At least one special character
              </li>
            </ul>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClassName}
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} size="sm" className="gap-2">
              <Lock className="w-4 h-4" />
              {isSubmitting ? "Updating…" : isResetFlow ? "Reset password" : "Update password"}
            </Button>
            {!hideBackLink && (
              <Link
                href={redirectTo ?? (isResetFlow ? "/login" : "/profile")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {redirectTo ? "Back to dashboard" : (isResetFlow ? "Back to login" : "Back to profile")}
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
