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
import BrandApplicationService from "@/services/brand-application.service";
import InterestsService from "@/services/interests.service";
import { Interest } from "@/types/interest.types";
import { COUNTRY_PHONE_CODES } from "@/utils/constants";
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

export default function BrandApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
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
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('GB'); // UK par défaut

  // Fetch interests on mount
  useEffect(() => {
    const fetchInterests = async () => {
      const fetchedInterests = await InterestsService.getAllInterests();
      setInterests(fetchedInterests);
    };
    fetchInterests();
  }, []);

  // Load cached form data on mount (before initializing defaults)
  useEffect(() => {
    const cached = FormCacheService.loadFormData();
    if (cached) {
      setFormData(prev => ({
        ...prev,
        ...cached,
      }));
      
      // Extract country code from phone number if present
      if (cached.contact_phone) {
        const phoneMatch = cached.contact_phone.match(/^\+(\d{1,4})/);
        if (phoneMatch) {
          const dialCode = `+${phoneMatch[1]}`;
          const country = COUNTRY_PHONE_CODES.find(c => c.dialCode === dialCode);
          if (country) {
            setSelectedCountryCode(country.code);
          }
        }
      }
      
      toast.info("Resumed application", {
        description: "Your previous progress has been restored.",
      });
    } else {
      // Initialize phone number with UK code only if no cache exists
      if (!formData.contact_phone) {
        const initialPhone = '+44 ';
        setFormData(prev => ({
          ...prev,
          contact_phone: initialPhone
        }));
        FormCacheService.saveFormData({ contact_phone: initialPhone });
      }
    }
  }, []);

  const isNextDisabled = (() => {
    switch (currentStep) {
      case 1: {
        const email = formData.contact_email?.trim();
        const firstName = formData.contact_first_name?.trim();
        const lastName = formData.contact_last_name?.trim();
        return !email || !firstName || !lastName;
      }
      case 2: {
        const brandName = formData.brand_name?.trim();
        const interestsCount = formData.interest_ids?.length || 0;
        return !brandName || interestsCount < 1;
      }
      case 3: {
        const regNumber = formData.business_registration_number?.trim();
        const country = formData.country?.trim();
        const street = formData.headquarters_street?.trim();
        const city = formData.headquarters_city?.trim();
        const zip = formData.headquarters_zip_code?.trim();
        return !regNumber || !country || !street || !city || !zip;
      }
      default:
        return false;
    }
  })();

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

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleFinalSubmit = async () => {
    // Validate all steps
    const validation = validateAllSteps(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Validation failed", {
        description: "Please check all fields and try again.",
      });
      return;
    }

    try {
      // Prepare data for API
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

      // Submit to API
      const result = await BrandApplicationService.createApplication(applicationData);

      if (result) {
        // Clear cache on success
        FormCacheService.clearFormData();
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      // Keep cache so user can retry
    }
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
                disableStepIndicators
                isNextDisabled={isNextDisabled}
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
                  onCountryCodeChange={setSelectedCountryCode}
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
