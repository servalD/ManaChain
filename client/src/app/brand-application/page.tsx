"use client";

import { useState, useEffect } from "react";
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
import FormCacheService from "@/services/form-cache.service";
import { useMounted } from "@/hooks/useMounted";
import { useAuth } from "@/hooks/useAuth";
import { useThemedLogoSrc } from "@/hooks/useThemedLogoSrc";
import { useCreateBrandApplication, toCreateBrandApplicationRequest } from "@/hooks/api/useBrandApplications";
import { useInterests } from "@/hooks/api/useInterests";
import {
  validateContactInfo,
  validateBrandInfo,
  validateLegalInfo,
  validateAdditionalInfo,
  validateDocuments,
  validateAllSteps,
} from "@/utils/brand-application-validation";

interface FormData {
  // Contact Information
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  // Brand Information
  brand_name: string;
  interest_ids: string[];
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
    tiktok?: string;
    youtube?: string;
  };
  how_did_you_hear_about_us: string;
  // Documents
  registration_proof_url: string;
}

const DEFAULT_FORM_DATA: FormData = {
  contact_email: '',
  contact_first_name: '',
  contact_last_name: '',
  contact_phone: '',
  brand_name: '',
  interest_ids: [],
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
};

export default function BrandApplicationPage() {
  const router = useRouter();
  const logoSrc = useThemedLogoSrc();
  const mounted = useMounted();
  // Un compte est requis avant de candidater : l'upload d'image (étapes Brand/Documents)
  // appelle un endpoint backend authentifié, il faut donc déjà un token en session.
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth("/login?redirect=/brand-application");
  const [cachedFormData] = useState(() => FormCacheService.loadFormData());
  const [formData, setFormData] = useState<FormData>(() =>
    cachedFormData ? { ...DEFAULT_FORM_DATA, ...cachedFormData } : DEFAULT_FORM_DATA
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { data: interests = [] } = useInterests();
  const createApplication = useCreateBrandApplication();
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    () => cachedFormData?.contact_phone_country_code || 'US' // +1 par défaut
  );

  const handleCountryCodeChange = (code: string) => {
    setSelectedCountryCode(code);
    FormCacheService.saveFormData({ contact_phone_country_code: code });
  };

  // Detect dark mode for logo
  // Notify the user once if their form was restored from cache.
  useEffect(() => {
    if (cachedFormData) {
      toast.info("Resumed application", {
        description: "Your previous progress has been restored.",
      });
    }
  }, [cachedFormData]);

  // L'état initial du formulaire dépend du cache localStorage (inexistant côté serveur) :
  // on ne rend le formulaire qu'après hydratation pour éviter un hydration mismatch.
  // Le spinner sert aussi pendant la vérification de session / la redirection vers /login.
  if (!mounted || isAuthLoading || !isAuthenticated) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleChange = (field: string, value: string | object) => {
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      return updated;
    });
    
    // Save to cache immediately
    FormCacheService.saveFormData({ [field]: value });
    
    // Clear validation error for this field if it exists
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // If updating social_media_links, also clear errors for individual platforms
    if (field === 'social_media_links' && typeof value === 'object' && value !== null) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        // Clear errors for all social media platforms
        ['twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube'].forEach(platform => {
          if (newErrors[platform]) {
            delete newErrors[platform];
          }
        });
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    let validation;
    
    switch (step) {
      case 1:
        validation = validateContactInfo({
          contact_email: formData.contact_email,
          contact_first_name: formData.contact_first_name,
          contact_last_name: formData.contact_last_name,
          contact_phone: formData.contact_phone,
        });
        break;
      case 2:
        validation = validateBrandInfo({
          brand_name: formData.brand_name,
          interest_ids: formData.interest_ids,
          description: formData.description,
          website_url: formData.website_url,
          logo_url: formData.logo_url,
        });
        break;
      case 3:
        validation = validateLegalInfo({
          business_registration_number: formData.business_registration_number,
          country: formData.country,
          headquarters_street: formData.headquarters_street,
          headquarters_city: formData.headquarters_city,
          headquarters_zip_code: formData.headquarters_zip_code,
          headquarters_address_complement: formData.headquarters_address_complement,
        });
        break;
      case 4:
        validation = validateAdditionalInfo({
          motivation: formData.motivation,
          estimated_community_size: formData.estimated_community_size,
          social_media_links: formData.social_media_links,
          how_did_you_hear_about_us: formData.how_did_you_hear_about_us,
        });
        break;
      case 5:
        validation = validateDocuments({
          registration_proof_url: formData.registration_proof_url,
        });
        break;
      default:
        validation = { isValid: true, errors: {} };
    }

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Show first error
      const firstError = Object.values(validation.errors)[0];
      toast.error("Validation failed", {
        description: firstError,
      });
      
      return false;
    }

    setValidationErrors({});
    return true;
  };

  // Throws on any failure (validation or API) so the Stepper — which awaits this —
  // knows not to collapse to its "completed" view; it stays on the last step instead
  // of going blank, letting the user fix the issue and retry (cache is kept either way).
  const handleFinalSubmit = async () => {
    const validation = validateAllSteps(formData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Validation failed", {
        description: "Please check all fields and try again.",
      });
      throw new Error("Brand application validation failed");
    }

    const applicationData = {
      contact_email: formData.contact_email,
      contact_first_name: formData.contact_first_name,
      contact_last_name: formData.contact_last_name,
      contact_phone: formData.contact_phone || undefined,
      brand_name: formData.brand_name,
      interest_ids: formData.interest_ids,
      description: formData.description || undefined,
      website_url: formData.website_url || undefined,
      logo_url: formData.logo_url || undefined,
      business_registration_number: formData.business_registration_number,
      country: formData.country,
      headquarters_street: formData.headquarters_street,
      headquarters_city: formData.headquarters_city,
      headquarters_zip_code: formData.headquarters_zip_code,
      headquarters_address_complement: formData.headquarters_address_complement || undefined,
      motivation: formData.motivation || undefined,
      estimated_community_size: formData.estimated_community_size
        ? parseInt(formData.estimated_community_size, 10)
        : undefined,
      social_media_links: Object.keys(formData.social_media_links).length > 0
        ? formData.social_media_links
        : undefined,
      how_did_you_hear_about_us: formData.how_did_you_hear_about_us || undefined,
      registration_proof_url: formData.registration_proof_url || undefined,
    };

    // mutateAsync rejects on error (errorToast already shown by the hook) — propagates
    // out of this function so the Stepper knows the final step did not complete.
    await createApplication.mutateAsync({ data: toCreateBrandApplicationRequest(applicationData) });

    FormCacheService.clearFormData();
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
              <p className="text-muted-foreground flex items-center gap-2">
                Join the
                <img
                  src={logoSrc}
                  alt="Mana Chain"
                  className="h-3.5 w-auto object-contain"
                />
                platform and create your community token
              </p>
            </div>
          </div>

          {/* Scrollable Stepper Container */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="w-full max-w-2xl mx-auto">
              <Stepper
                initialStep={1}
                onFinalStepCompleted={handleFinalSubmit}
                backButtonText="Previous"
                nextButtonText="Next"
                stepCircleContainerClassName="bg-card/50 backdrop-blur-sm max-w-4xl"
                stepContainerClassName="bg-card/30"
                contentClassName="text-foreground"
                footerClassName=""
                disableStepIndicators
                canChangeStep={(targetStep, current) => {
                  // Only validate when moving forward
                  if (targetStep > current) {
                    return validateCurrentStep(current);
                  }
                  return true;
                }}
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
                  errors={validationErrors}
                  selectedCountryCode={selectedCountryCode}
                  onCountryCodeChange={handleCountryCodeChange}
                />
              </Step>

              <Step>
                <BrandInformation 
                  formData={{
                    brand_name: formData.brand_name,
                    interest_ids: formData.interest_ids,
                    description: formData.description,
                    website_url: formData.website_url,
                    logo_url: formData.logo_url,
                  }}
                  onChange={handleChange}
                  interests={interests}
                  errors={validationErrors}
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
                  errors={validationErrors}
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
                  errors={validationErrors}
                />
              </Step>

              <Step>
                <Documents 
                  formData={{
                    registration_proof_url: formData.registration_proof_url,
                  }}
                  onChange={handleChange}
                  errors={validationErrors}
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
