 "use client";

import React, { Suspense, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SignUpPage, Interest, SignUpFormData } from "@/components/ui/sign-up";
import { useRouter, useSearchParams } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import { useRegister } from "@/hooks/api/useAuth";
import type { RegisterRequestAgeRange } from "@/api/generated/models";
import { ApiService } from "@/services/api.service";
import { useInterests } from "@/hooks/api/useInterests";
import { toast } from "@/lib/toast";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useThemedLogoSrc } from "@/hooks/useThemedLogoSrc";
import { isSafeInternalPath } from "@/utils/validation";
import { savePostAuthRedirect } from "@/utils/post-auth-redirect";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = isSafeInternalPath(redirectParam) ? redirectParam : null;
  const loginPath = safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : "/login";

  // Persisted so it survives the "check your email, click the verification link" gap,
  // where `/verify-email` is opened fresh with no `redirect` param of its own.
  useEffect(() => {
    if (safeRedirect) savePostAuthRedirect(safeRedirect);
  }, [safeRedirect]);
  const toasterRef = useRef<ToasterRef>(null);
  const logoSrc = useThemedLogoSrc();
  const { data: interestsData, isLoading } = useInterests();
  const register = useRegister();
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("auth.common");
  const availableInterests: Interest[] = useMemo(
    () =>
      (interestsData ?? []).map((interest) => ({
        id: interest.id,
        label: interest.label || interest.id,
        icon: interest.icon || "📌",
      })),
    [interestsData]
  );

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>, formData: SignUpFormData) => {
    event.preventDefault();
    
    // Validate interests (min 3, max 5)
    if (!formData.interests || formData.interests.length < 3) {
      toast({
        title: t("toasts.moreInterestsTitle"),
        description: t("toasts.moreInterestsMessage"),
        variant: "warning",
      });
      return;
    }

    if (formData.interests.length > 5) {
      toast({
        title: t("toasts.tooManyInterestsTitle"),
        description: t("toasts.tooManyInterestsMessage"),
        variant: "warning",
    });
      return;
    }

    // Validate age range
    if (!formData.ageRange) {
      toast({
        title: t("toasts.ageRangeRequiredTitle"),
        description: t("toasts.ageRangeRequiredMessage"),
        variant: "warning",
      });
      return;
    }

    register.mutate(
      {
        data: {
          email: formData.email,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          ageRange: formData.ageRange as RegisterRequestAgeRange,
          interests: formData.interests,
        },
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            router.push(loginPath);
          }, 1500);
        },
      }
    );
  };

  const handleGoogleSignUp = () => {
    const apiBase = ApiService.baseURL;
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleSignIn = () => {
    router.push(loginPath);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-foreground text-xl">{t("loading")}</div>
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
      <SignUpPage
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
        interests={availableInterests}
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onSignIn={handleSignIn}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-screen flex items-center justify-center">
          <div className="text-foreground text-xl">Loading...</div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
