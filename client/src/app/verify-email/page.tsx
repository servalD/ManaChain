"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AuthService from "@/services/auth.service";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const result = await AuthService.verifyEmail(token);
        
        if (result) {
          setStatus("success");
          setMessage("Your email has been successfully verified! You can now log in to your account.");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage("Verification failed. The link may be invalid or expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="dark bg-linear-to-br from-black via-gray-950 to-black min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-8"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
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
              <h1 className="text-3xl font-bold text-white">
                {status === "loading" && "Verifying your email..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </h1>
              
              <p className="text-gray-400 text-sm max-w-sm">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col w-full gap-3 pt-4">
              {status === "success" && (
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

              {status === "error" && (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full rounded-2xl py-3 px-4 font-medium text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Go to Login
                  </button>
                  
                  <Link
                    href="/"
                    className="w-full rounded-2xl py-3 px-4 font-medium text-gray-400 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center"
                  >
                    Back to Home
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        {status === "error" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Need help?{" "}
              <button
                onClick={async () => {
                  const email = prompt("Please enter your email address:");
                  if (email) {
                    await AuthService.resendVerification(email);
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="dark bg-linear-to-br from-black via-gray-950 to-black min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
