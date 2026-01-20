"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SOCIAL_MEDIA_PLATFORMS, REFERRAL_SOURCES } from "@/utils/constants";

interface AdditionalInformationProps {
  formData: {
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
  };
  onChange: (field: string, value: string | object) => void;
  errors?: Record<string, string>;
}

export function AdditionalInformation({ formData, onChange, errors = {} }: AdditionalInformationProps) {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const handleSocialMediaChange = (platform: string, value: string) => {
    onChange('social_media_links', {
      ...formData.social_media_links,
      [platform]: value
    });
    
    // Clear error for this platform when user starts typing
    if (errors[platform]) {
      // The error will be cleared by the parent's handleChange
    }
  };

  const togglePlatform = (platform: string) => {
    setExpandedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Additional Information</h2>
        <p className="text-sm text-muted-foreground">
          Help us understand your community and goals
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-foreground mb-2">
            Why do you want to join Mana Chain?
          </label>
          <textarea
            id="motivation"
            name="motivation_manual"
            value={formData.motivation}
            onChange={(e) => onChange('motivation', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 min-h-[120px] ${
              errors.motivation ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="Share your motivation and how Mana Chain can help your brand..."
            autoComplete="new-password"
          />
          {errors.motivation && (
            <p className="mt-1 text-xs text-red-500">{errors.motivation}</p>
          )}
        </div>

        <div>
          <label htmlFor="estimated_community_size" className="block text-sm font-medium text-foreground mb-2">
            Estimated Community Size
          </label>
          <input
            id="estimated_community_size"
            type="number"
            name="estimated_community_size_manual"
            value={formData.estimated_community_size}
            onChange={(e) => onChange('estimated_community_size', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.estimated_community_size ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="10000"
            min="0"
            autoComplete="new-password"
          />
          {errors.estimated_community_size ? (
            <p className="mt-1 text-xs text-red-500">{errors.estimated_community_size}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Approximate number of followers/customers across all platforms
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Social Media Links
          </label>
          <div className="space-y-2">
            {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
              const isExpanded = expandedPlatforms.has(platform.key);
              const hasValue = !!formData.social_media_links[platform.key as keyof typeof formData.social_media_links];
              
              return (
                <div key={platform.key} className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePlatform(platform.key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {platform.label}
                      {hasValue && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({formData.social_media_links[platform.key as keyof typeof formData.social_media_links]?.substring(0, 30)}...)
                        </span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 pt-3 pb-3">
                      <input
                        id={platform.key}
                        type="url"
                        name={`${platform.key}_manual`}
                        value={formData.social_media_links[platform.key as keyof typeof formData.social_media_links] || ''}
                        onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          errors[platform.key] ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
                        }`}
                        placeholder={platform.placeholder}
                        autoComplete="new-password"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {errors[platform.key] && (
                        <p className="mt-1 text-xs text-red-500">{errors[platform.key]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="how_did_you_hear_about_us" className="block text-sm font-medium text-foreground mb-1">
            How did you hear about us?
          </label>
          <select
            id="how_did_you_hear_about_us"
            value={formData.how_did_you_hear_about_us}
            onChange={(e) => onChange('how_did_you_hear_about_us', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">Select an option</option>
            {REFERRAL_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
