"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForgotPassword } from "@/hooks/api/useAuth";
import { isValidEmail } from "@/utils/validation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    // Anti-énumération : on affiche toujours l'écran "submitted", succès ou échec.
    forgotPassword.mutate(
      { data: { email: email.trim() } },
      {
        onSettled: () => {
          setSubmitted(true);
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-6 right-6 z-50">
        <AnimatedThemeToggler
          className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 pt-20">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                Forgot password
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we will send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground">
                If an account exists with this email, you will receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isSubmitting} size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
