"use client";

import { useRef } from "react";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";
import AuthService from "@/services/auth.service";
import { isValidEmail } from "@/utils/validation";

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

      if (result) {
        // Redirect to discover page after successful login
        setTimeout(() => {
          router.push("/discover");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
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
    toasterRef.current?.show({
      title: 'Check your email',
      message: 'Password reset instructions have been sent to your email address.',
      variant: 'success',
      duration: 4000,
    });
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <div className="dark bg-linear-to-br from-black via-gray-950 to-black">
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      <SignInPage
        title={
          <span className="font-light text-white tracking-tighter">
            Welcome to <span className="font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Mana Chain</span>
          </span>
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
