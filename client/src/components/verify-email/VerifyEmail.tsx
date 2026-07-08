"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useVerifyEmail, useResendVerification } from "@/hooks/api/useAuth";
import { useVerifyBrandApplicationEmail } from "@/hooks/api/useBrandApplications";

interface VerifyEmailProps {
  token: string | null;
  type: "user" | "brand";
}

export default function VerifyEmail({ token, type }: VerifyEmailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const verifyBrandEmail = useVerifyBrandApplicationEmail();
  const verifyUserEmail = useVerifyEmail();
  const resendVerification = useResendVerification();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    if (type === "user") {
      verifyUserEmail.mutate(
        { data: { token } },
        {
          onSuccess: () => {
            setStatus("success");
            setMessage("Your email has been successfully verified! You can now log in to your account.");
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.push("/login");
            }, 3000);
          },
          onError: () => {
            setStatus("error");
            setMessage("Verification failed. The link may be invalid or expired.");
          },
        }
      );
    } else {
      // type === "brand"
      verifyBrandEmail.mutate(
        { data: { token } },
        {
          onSuccess: () => {
            setStatus("success");
            setMessage("Your email has been successfully verified! Your brand application will be reviewed by our team soon.");
          },
          onError: () => {
            setStatus("error");
            setMessage("Verification failed. The link may be invalid or expired.");
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type, router]);

  const getTitle = () => {
    if (status === "loading") {
      return type === "user" ? "Verifying your email..." : "Verifying Email...";
    }
    if (status === "success") {
      return "Email Verified!";
    }
    return "Verification Failed";
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mb-8"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              {status === "loading" && (
                <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
                </div>
              )}
              
              {status === "success" && (
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
              )}
              
              {status === "error" && (
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className={`${type === "user" ? "text-3xl" : "text-2xl"} font-bold text-foreground`}>
                {getTitle()}
              </h1>
              
              <p className={`text-muted-foreground ${type === "user" ? "text-sm max-w-sm" : ""}`}>
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col w-full gap-3 pt-4">
              {status === "success" && type === "user" && (
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-2xl py-3 px-4 font-medium text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(to right, #7c3aed, #a855f7)',
                    boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)'
                  }}
                >
                  Go to Login
                </button>
              )}

              {status === "success" && type === "brand" && (
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
                >
                  Return to Home
                </Link>
              )}

              {status === "error" && type === "user" && (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full rounded-2xl py-3 px-4 font-medium text-foreground border border-border bg-accent/50 hover:bg-accent transition-all"
                  >
                    Go to Login
                  </button>
                  
                  <Link
                    href="/"
                    className="w-full rounded-2xl py-3 px-4 font-medium text-muted-foreground hover:text-foreground border border-border bg-accent/50 hover:bg-accent transition-all text-center"
                  >
                    Back to Home
                  </Link>
                </>
              )}

              {status === "error" && type === "brand" && (
                <>
                  <Link
                    href="/brand-application"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
                  >
                    Submit New Application
                  </Link>
                  <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-medium transition-colors"
                  >
                    Return to Home
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        {status === "error" && type === "user" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <button
                onClick={() => {
                  const email = prompt("Please enter your email address:");
                  if (email) {
                    resendVerification.mutate({ data: { email } });
                  }
                }}
                className="text-violet-400 hover:text-violet-300 hover:underline transition-colors"
              >
                Resend verification email
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
