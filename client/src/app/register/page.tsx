 "use client";
 
import React, { useRef, useState, useEffect } from "react";
import { SignUpPage, Interest, SignUpFormData } from "@/components/ui/sign-up";
import { useRouter } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import AuthService from "@/services/auth.service";
import { ApiService } from "@/services/api.service";
import InterestsService from "@/services/interests.service";
import { toast } from "@/lib/toast";
import { isValidEmail, isValidPassword } from "@/utils/validation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function RegisterPage() {
  const router = useRouter();
  const toasterRef = useRef<ToasterRef>(null);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg");

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

  // Load interests from API
  useEffect(() => {
    const loadInterests = async () => {
      try {
        const interests = await InterestsService.getAllInterests();
        const formattedInterests: Interest[] = interests.map(interest => ({
          id: interest.id,
          label: interest.label || interest.id,
          icon: interest.icon || "📌",
        }));
        setAvailableInterests(formattedInterests);
      } catch (error) {
        console.error("Error loading interests:", error);
        toast({
          title: "Error loading interests",
          description: "Using default interests",
          variant: "warning",
        });
        // Fallback to default interests
        setAvailableInterests([
          { id: "fashion", label: "Fashion", icon: "👗" },
          { id: "tech", label: "Technology", icon: "💻" },
          { id: "food", label: "Food & Drinks", icon: "🍕" },
          { id: "sports", label: "Sports", icon: "⚽" },
          { id: "music", label: "Music", icon: "🎵" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInterests();
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

    try {
      const result = await AuthService.register({
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        ageRange: formData.ageRange,
        interests: formData.interests,
    });

      if (result) {
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
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
