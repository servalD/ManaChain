"use client";

import { useRef, useState, useEffect } from "react";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import AuthService from "@/services/auth.service";
import { isValidEmail } from "@/utils/validation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

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
    text: "Community tokens changed everything for our brand. The engagement is unprecedented!"
  },
];

export default function LoginPage() {
  const router = useRouter();
  const toasterRef = useRef<ToasterRef>(null);
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

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const email = data.email as string;
    const password = data.password as string;

    if (!email || !password) {
      toasterRef.current?.show({
        title: 'Missing fields',
        message: 'Please enter your email and password.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      toasterRef.current?.show({
        title: 'Invalid email',
        message: 'Please enter a valid email address.',
        variant: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await AuthService.login(email, password);

      if (result && result.user) {
        // Redirect based on user role
        const redirectPath = getRedirectPathByRole(result.user.role);
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const getRedirectPathByRole = (role?: string): string => {
    switch (role) {
      case 'CLIENT':
        return '/discover';
      case 'BRANDUSER':
        return '/brand/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        // Default to discover for backward compatibility
        return '/discover';
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    toasterRef.current?.show({
      title: 'Coming Soon',
      message: 'Google Sign In integration is currently in development.',
      variant: 'warning',
      duration: 3000,
    });
  };
  
  const handleResetPassword = () => {
    router.push('/forgot-password');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <div className="bg-background relative">
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      {/* Theme Toggler */}
      <div className="fixed top-6 right-6 z-50">
        <AnimatedThemeToggler 
          className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground"
        />
      </div>
      <SignInPage
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
        description="Sign in to access your community tokens and engage with your favorite brands"
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
