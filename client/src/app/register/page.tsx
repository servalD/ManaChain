"use client";

import React, { useRef } from "react";
import { SignUpPage, Interest } from "@/components/ui/sign-up";
import { useRouter } from "next/navigation";
import Toaster, { ToasterRef } from "@/components/ui/toast";

const availableInterests: Interest[] = [
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "tech", label: "Technology", icon: "💻" },
  { id: "food", label: "Food & Drinks", icon: "🍕" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "art", label: "Art & Design", icon: "🎨" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "fitness", label: "Fitness", icon: "💪" },
  { id: "beauty", label: "Beauty", icon: "💄" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "movies", label: "Movies & TV", icon: "🎬" },
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "eco", label: "Eco-Friendly", icon: "🌱" },
];

export default function RegisterPage() {
  const router = useRouter();
  const toasterRef = useRef<ToasterRef>(null);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>, data: any) => {
    event.preventDefault();
    
    // Validation des centres d'intérêt
    if (data.interests.length < 3) {
      toasterRef.current?.show({
        title: 'More interests needed',
        message: 'Please select at least 3 interests to continue.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    console.log("Registration data:", data);

    // Show loading toast
    toasterRef.current?.show({
      title: 'Creating account...',
      message: 'Please wait while we set up your profile.',
      variant: 'default',
      duration: 2000,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show success toast
    toasterRef.current?.show({
      title: 'Welcome to Mana Chain!',
      message: `Your account has been created successfully, ${data.firstName}!`,
      variant: 'success',
      duration: 3000,
    });

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const handleGoogleSignUp = () => {
    console.log("Google Sign Up clicked");
    toasterRef.current?.show({
      title: 'Coming Soon',
      message: 'Google Sign Up integration is currently in development.',
      variant: 'warning',
      duration: 3000,
    });
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <div className="dark bg-gradient-to-br from-black via-gray-950 to-black">
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      <SignUpPage
        title={
          <span className="font-light text-white tracking-tighter">
            Welcome to <span className="font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Mana Chain</span>
          </span>
        }
        description="Create your account and discover community tokens from your favorite brands"
        heroImageSrc="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=2160&q=80"
        interests={availableInterests}
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onSignIn={handleSignIn}
      />
    </div>
  );
}
