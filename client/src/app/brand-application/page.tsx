"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Stepper, { Step } from "@/components/ui/Stepper";
import { 
  ContactInformation, 
  BrandInformation, 
  LegalInformation, 
  AdditionalInformation, 
  Documents 
} from "@/components/brand-application";
import { toast } from "sonner";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface FormData {
  // Contact Information
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  // Brand Information
  brand_name: string;
  industry_type: string;
  description: string;
  website_url: string;
  logo_url: string;
  // Legal Information
  business_registration_number: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement: string;
  // Additional Information
  motivation: string;
  estimated_community_size: string;
  social_media_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  how_did_you_hear_about_us: string;
  // Documents
  registration_proof_url: string;
}

export default function BrandApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    contact_email: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_phone: '',
    brand_name: '',
    industry_type: '',
    description: '',
    website_url: '',
    logo_url: '',
    business_registration_number: '',
    country: '',
    headquarters_street: '',
    headquarters_city: '',
    headquarters_zip_code: '',
    headquarters_address_complement: '',
    motivation: '',
    estimated_community_size: '',
    social_media_links: {},
    how_did_you_hear_about_us: '',
    registration_proof_url: '',
  });

  const handleChange = (field: string, value: string | object) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (step: number) => {
    toast.success(`Step ${step} completed!`, {
      description: "Moving to the next step...",
    });
  };

  const handleFinalSubmit = () => {
    // Mock validation
    if (!formData.contact_email || !formData.contact_first_name || !formData.contact_last_name) {
      toast.error("Missing required fields", {
        description: "Please fill in all required contact information.",
      });
      return;
    }

    if (!formData.brand_name || !formData.industry_type) {
      toast.error("Missing required fields", {
        description: "Please fill in all required brand information.",
      });
      return;
    }

    if (!formData.business_registration_number || !formData.country || 
        !formData.headquarters_street || !formData.headquarters_city || 
        !formData.headquarters_zip_code) {
      toast.error("Missing required fields", {
        description: "Please fill in all required legal information.",
      });
      return;
    }

    if (!formData.registration_proof_url) {
      toast.error("Missing required document", {
        description: "Please provide your business registration proof.",
      });
      return;
    }

    // Mock successful submission
    toast.success("Application submitted successfully!", {
      description: "We will review your application and get back to you soon.",
      duration: 5000,
    });

    // Log form data for debugging
    console.log("Application Data:", formData);

    // Redirect to home page after a delay
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  return (
    <div className="h-dvh flex flex-col font-geist w-dvw bg-background">
      {/* Theme Toggler */}
      <div className="fixed top-6 right-6 z-50">
        <AnimatedThemeToggler 
          className="p-2 rounded-lg bg-card/50 border border-border hover:bg-accent transition-colors text-foreground [&>svg]:h-5 [&>svg]:w-5"
        />
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left column: Stepper */}
        <section className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
          {/* Back Button */}
          <Link 
            href="/" 
            className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group z-10"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          {/* Fixed Header */}
          <div className="shrink-0 px-8 pt-20 pb-4">
            <div className="w-full max-w-2xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-foreground mb-2">
                <span className="font-light">Brand </span>
                <span className="font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Application</span>
              </h1>
              <p className="text-muted-foreground">
                Join the Mana Chain platform and create your community token
              </p>
            </div>
          </div>

          {/* Scrollable Stepper Container */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="w-full max-w-2xl mx-auto">
              <Stepper
              initialStep={1}
              onStepChange={handleStepChange}
              onFinalStepCompleted={handleFinalSubmit}
              backButtonText="Previous"
              nextButtonText="Next"
              stepCircleContainerClassName="bg-card/50 backdrop-blur-sm max-w-4xl"
              stepContainerClassName="bg-card/30"
              contentClassName="text-foreground"
              footerClassName=""
            >
              <Step>
                <ContactInformation 
                  formData={{
                    contact_email: formData.contact_email,
                    contact_first_name: formData.contact_first_name,
                    contact_last_name: formData.contact_last_name,
                    contact_phone: formData.contact_phone,
                  }}
                  onChange={handleChange}
                />
              </Step>

              <Step>
                <BrandInformation 
                  formData={{
                    brand_name: formData.brand_name,
                    industry_type: formData.industry_type,
                    description: formData.description,
                    website_url: formData.website_url,
                    logo_url: formData.logo_url,
                  }}
                  onChange={handleChange}
                />
              </Step>

              <Step>
                <LegalInformation 
                  formData={{
                    business_registration_number: formData.business_registration_number,
                    country: formData.country,
                    headquarters_street: formData.headquarters_street,
                    headquarters_city: formData.headquarters_city,
                    headquarters_zip_code: formData.headquarters_zip_code,
                    headquarters_address_complement: formData.headquarters_address_complement,
                  }}
                  onChange={handleChange}
                />
              </Step>

              <Step>
                <AdditionalInformation 
                  formData={{
                    motivation: formData.motivation,
                    estimated_community_size: formData.estimated_community_size,
                    social_media_links: formData.social_media_links,
                    how_did_you_hear_about_us: formData.how_did_you_hear_about_us,
                  }}
                  onChange={handleChange}
                />
              </Step>

              <Step>
                <Documents 
                  formData={{
                    registration_proof_url: formData.registration_proof_url,
                  }}
                  onChange={handleChange}
                />
              </Step>
              </Stepper>
            </div>
          </div>
        </section>

        {/* Right column: Hero image */}
        <section className="hidden md:block flex-1 relative p-4">
          <div className="absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(/event.png)` }}></div>
        </section>
      </div>
    </div>
  );
}
