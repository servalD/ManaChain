import React, { useState } from 'react';
import { Eye, EyeOff, Check, ArrowLeft, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { getPasswordCriteria } from '@/utils/validation';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

export interface Interest {
  id: string;
  label: string;
  icon: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  interests?: Interest[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>, data: any) => void;
  onGoogleSignUp?: () => void;
  onSignIn?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-accent/30 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const InterestButton = ({ 
  interest, 
  selected, 
  onClick 
}: { 
  interest: Interest; 
  selected: boolean; 
  onClick: () => void;
}) => {
  const label = interest.label || interest.id;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300 w-full min-h-[48px]
        ${selected 
          ? 'border-violet-500 bg-violet-500/20' 
          : 'border-border bg-accent/30 hover:border-violet-400/50 hover:bg-accent/50'
        }
      `}
    >
      <span className="text-xl shrink-0 flex items-center justify-center w-6">{interest.icon}</span>
      <span 
        className={`text-sm font-medium flex-1 text-left min-w-0 ${selected ? 'text-foreground' : 'text-foreground/90'}`}
      >
        {label}
      </span>
      {selected && (
        <Check className="h-4 w-4 shrink-0 text-violet-400 ml-2" />
      )}
    </button>
  );
};

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Create Account</span>,
  description = "Join the community and start engaging with your favorite brands",
  heroImageSrc,
  interests = [],
  onSignUp,
  onGoogleSignUp,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  
  // Password validation criteria
  const passwordCriteria = getPasswordCriteria(password);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        // Remove interest
        return prev.filter(id => id !== interestId);
      } else {
        // Add interest only if we haven't reached the maximum
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, interestId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      interests: selectedInterests
    };
    onSignUp?.(e, data);
  };

  return (
    <div className="h-dvh flex flex-col md:flex-row font-geist w-dvw bg-background">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-start justify-center p-8 bg-transparent overflow-y-auto relative">
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group z-10"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <div className="w-full max-w-md py-8 my-auto">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-foreground">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* First Name & Last Name */}
              <div className="animate-element animate-delay-400 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <GlassInputWrapper>
                    <input 
                      name="firstName" 
                      type="text" 
                      required
                      placeholder="First name" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50" 
                    />
                  </GlassInputWrapper>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <GlassInputWrapper>
                    <input 
                      name="lastName" 
                      type="text" 
                      required
                      placeholder="Last name" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50" 
                    />
                  </GlassInputWrapper>
                </div>
              </div>

              {/* Age Range */}
              <div className="animate-element animate-delay-475">
                <label className="text-sm font-medium text-muted-foreground">Age Range</label>
                <div className="relative">
                  <GlassInputWrapper>
                    <select 
                      name="ageRange" 
                      required
                      className="w-full bg-transparent text-sm p-4 pr-10 rounded-2xl focus:outline-none text-foreground appearance-none cursor-pointer [&>option]:bg-popover [&>option]:text-foreground"
                    >
                      <option value="" className="bg-popover text-muted-foreground">Select your age range</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55-64">55-64</option>
                      <option value="65+">65+</option>
                    </select>
                  </GlassInputWrapper>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none transition-transform group-hover:rotate-180" />
                </div>
              </div>

              {/* Username */}
              <div className="animate-element animate-delay-350">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <GlassInputWrapper>
                  <input 
                    name="username" 
                    type="text" 
                    required
                    placeholder="Choose a username" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50" 
                  />
                </GlassInputWrapper>
              </div>

              {/* Email */}
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    required
                    placeholder="Enter your email address" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50" 
                  />
                </GlassInputWrapper>
              </div>

              {/* Password */}
              <div className="animate-element animate-delay-450">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Create a password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs transition-colors ${passwordCriteria.length ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {passwordCriteria.length ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${passwordCriteria.digit ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {passwordCriteria.digit ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>At least one digit</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${passwordCriteria.special ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {passwordCriteria.special ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>At least one special character</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests Selection */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Interests <span className="text-violet-400">(Select 3 to 5)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {interests.map((interest) => (
                    <InterestButton
                      key={interest.id}
                      interest={interest}
                      selected={selectedInterests.includes(interest.id)}
                      onClick={() => toggleInterest(interest.id)}
                    />
                  ))}
                </div>
                {selectedInterests.length > 0 && selectedInterests.length < 3 && (
                  <p className="text-xs text-amber-400 mt-2">
                    Please select {3 - selectedInterests.length} more interest{3 - selectedInterests.length > 1 ? 's' : ''}
                  </p>
                )}
                {selectedInterests.length >= 5 && (
                  <p className="text-xs text-amber-400 mt-2">
                    Maximum 5 interests selected
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={selectedInterests.length < 3 || selectedInterests.length > 5}
                className="animate-element animate-delay-600 w-full rounded-2xl py-4 font-medium transition-all disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100" 
                style={{
                  background: (selectedInterests.length >= 3 && selectedInterests.length <= 5) ? 'linear-gradient(to right, #7c3aed, #a855f7)' : 'rgb(100, 100, 100)',
                  color: 'white',
                  opacity: (selectedInterests.length >= 3 && selectedInterests.length <= 5) ? 1 : 0.5,
                  boxShadow: (selectedInterests.length >= 3 && selectedInterests.length <= 5) ? '0 4px 14px 0 rgba(124, 58, 237, 0.39)' : 'none'
                }}
              >
                Create Account
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignUp} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-accent/50 transition-colors text-foreground">
                <GoogleIcon />
                Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSignIn?.(); }} className="text-violet-400 hover:underline transition-colors">Sign In</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
        </section>
      )}
    </div>
  );
};
