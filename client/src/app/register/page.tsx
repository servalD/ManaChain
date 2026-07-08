 "use client";
 
import React, { useRef, useState, useEffect, useMemo } from "react";
import { SignUpPage, Interest, SignUpFormData } from "@/components/ui/sign-up";
import { useRouter } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import { useRegister } from "@/hooks/api/useAuth";
import type { RegisterRequestAgeRange } from "@/api/generated/models";
import { ApiService } from "@/services/api.service";
import { useInterests } from "@/hooks/api/useInterests";
import { toast } from "@/lib/toast";
import { isValidEmail, isValidPassword } from "@/utils/validation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function RegisterPage() {
  const router = useRouter();
  const toasterRef = useRef<ToasterRef>(null);
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg");
  const { data: interestsData, isLoading } = useInterests();
  const register = useRegister();
  const availableInterests: Interest[] = useMemo(
    () =>
      (interestsData ?? []).map((interest) => ({
        id: interest.id,
        label: interest.label || interest.id,
        icon: interest.icon || "📌",
      })),
    [interestsData]
  );

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

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>, formData: SignUpFormData) => {
    event.preventDefault();
    
    // Validate interests (min 3, max 5)
    if (!formData.interests || formData.interests.length < 3) {
      toast({
        title: "More interests needed",
        description: "Please select at least 3 interests to continue.",
        variant: "warning",
      });
      return;
    }

    if (formData.interests.length > 5) {
      toast({
        title: "Too many interests",
        description: "Please select a maximum of 5 interests.",
        variant: "warning",
    });
      return;
    }

    // Validate age range
    if (!formData.ageRange) {
      toast({
        title: "Age range required",
        description: "Please select your age range.",
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
            router.push("/login");
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
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-background relative">
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      {/* Theme Toggler */}
      <div className="fixed top-6 right-6 z-50">
        <AnimatedThemeToggler 
          className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
        />
      </div>
      <SignUpPage
        title={
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Welcome to
            </span>
            <img
              src={logoSrc}
              alt="Mana Chain"
              className="h-8 w-auto sm:h-10 object-contain"
            />
          </div>
        }
        description="Create your account and discover community badges from your favorite brands"
        heroImageSrc="/event.png"
        interests={availableInterests}
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onSignIn={handleSignIn}
      />
    </div>
  );
}
