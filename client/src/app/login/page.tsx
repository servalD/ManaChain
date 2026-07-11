"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useRouter, useSearchParams } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import { useLogin, useTwoFactorVerify } from "@/hooks/api/useAuth";
import { ApiService } from "@/services/api.service";
import axios from "axios";
import { isValidEmail } from "@/utils/validation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Mana Chain revolutionized how we engage with our community. The token system is brilliant!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This platform has transformed how brands connect with supporters. Clean, powerful, and intuitive."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "Community badges changed everything for our brand. The engagement is unprecedented!"
  },
];

function LoginPageFallback() {
  const t = useTranslations("auth.login");
  return (
    <div className="bg-background relative min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">{t("loadingFallback")}</div>
    </div>
  );
}

function getRedirectPathByRole(role?: string, user?: { passwordChanged?: boolean }): string {
  switch (role) {
    case 'CLIENT':
      return '/discover';
    case 'BRANDUSER':
      return user?.passwordChanged === false ? '/brand/change-password-required' : '/brand/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/discover';
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toasterRef = useRef<ToasterRef>(null);
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg");
  const login = useLogin();
  const twoFactorVerify = useTwoFactorVerify();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("auth.common");

  // Set once a challenge (local login or Google callback) requires a 2FA code.
  // Lazy initializer (not an effect): reads the Google-callback redirect params
  // once, at mount, from the initial URL — avoids a cascading setState-in-effect.
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(() =>
    searchParams.get("twoFactorRequired") === "true" ? searchParams.get("challengeToken") : null
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  // Handle Google OAuth callback: token + role in URL -> store token and redirect by role
  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const error = searchParams.get("error");

    if (error) {
      if (error === "use_password") {
        toasterRef.current?.show({
          title: t("toasts.usePasswordTitle"),
          message: t("toasts.usePasswordMessage"),
          variant: "warning",
          duration: 5000,
        });
      } else if (error === "access_denied") {
        toasterRef.current?.show({
          title: t("toasts.accessDeniedTitle"),
          message: t("toasts.accessDeniedMessage"),
          variant: "warning",
          duration: 4000,
        });
      } else {
        toasterRef.current?.show({
          title: t("toasts.googleFailedTitle"),
          message: t("toasts.googleFailedMessage"),
          variant: "error",
          duration: 5000,
        });
      }
      return;
    }

    if (token && role) {
      localStorage.setItem("Token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      toasterRef.current?.show({
        title: t("toasts.signedInTitle"),
        message: t("toasts.signedInMessage"),
        variant: "success",
        duration: 2000,
      });
      const redirectPath = getRedirectPathByRole(role);
      router.replace(redirectPath);
    }
  }, [searchParams, router, t]);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setLogoSrc(isDark ? "/Logo_ManaChain_Blanc.svg" : "/Logo_ManaChain_Noir.svg");
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const email = data.email as string;
    const password = data.password as string;

    if (!email || !password) {
      toasterRef.current?.show({
        title: t('toasts.missingFieldsTitle'),
        message: t('toasts.missingFieldsMessage'),
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      toasterRef.current?.show({
        title: t('toasts.invalidEmailTitle'),
        message: t('toasts.invalidEmailMessage'),
        variant: 'error',
        duration: 3000,
      });
      return;
    }

    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (result) => {
          if (result.twoFactorRequired) {
            setTwoFactorChallenge(result.challengeToken);
            return;
          }
          if (!result.user) return;
          // Redirect based on user role; brands with passwordChanged=false must set password first
          const redirectPath = getRedirectPathByRole(result.user.role, result.user);
          setTimeout(() => {
            router.push(redirectPath);
          }, 1000);
        },
      }
    );
  };

  const handleVerifyTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge || !twoFactorCode) return;

    twoFactorVerify.mutate(
      { data: { challengeToken: twoFactorChallenge, code: twoFactorCode } },
      {
        onSuccess: (result) => {
          if (!result.user) return;
          const redirectPath = getRedirectPathByRole(result.user.role, result.user);
          router.push(redirectPath);
        },
        onSettled: () => setTwoFactorCode(""),
      }
    );
  };

  const handleGoogleSignIn = () => {
    const apiBase = ApiService.baseURL;
    window.location.href = `${apiBase}/auth/google`;
  };
  
  const handleResetPassword = () => {
    router.push('/forgot-password');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  if (twoFactorChallenge) {
    return (
      <div className="bg-background relative min-h-screen flex items-center justify-center px-4">
        <Toaster ref={toasterRef} defaultPosition="top-right" />
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
          <LanguageSwitcher />
          <AnimatedThemeToggler
            className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
          />
        </div>
        <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="w-8 h-8 text-violet-400" />
            <h1 className="text-xl font-semibold text-foreground">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground">
              {useRecoveryCode
                ? "Enter one of your recovery codes."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>
          <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
            {useRecoveryCode ? (
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="xxxxx-xxxxx"
                autoFocus
                disabled={twoFactorVerify.isPending}
                className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 text-center font-mono"
              />
            ) : (
              <OtpInput value={twoFactorCode} onChange={setTwoFactorCode} autoFocus disabled={twoFactorVerify.isPending} />
            )}
            <Button type="submit" className="w-full" disabled={!twoFactorCode || twoFactorVerify.isPending}>
              {twoFactorVerify.isPending ? "Verifying…" : "Verify"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => {
              setUseRecoveryCode((v) => !v);
              setTwoFactorCode("");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {useRecoveryCode ? "Use an authenticator code instead" : "Use a recovery code instead"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative">
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      {/* Theme Toggler & Language Switcher */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <AnimatedThemeToggler
          className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
        />
      </div>
      <SignInPage
        title={
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              {tCommon("welcomeTo")}
            </span>
            <img
              src={logoSrc}
              alt="Mana Chain"
              className="h-8 w-auto sm:h-10 object-contain"
            />
          </div>
        }
        description={t("description")}
        heroImageSrc="/event.png"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
