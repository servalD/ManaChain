"use client";

import { cn } from "@/lib/utils";
import { Layers, Search, Zap } from "lucide-react";
import type React from "react";
import { useTranslations } from "next-intl";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";

// The main props for the HowItWorks component
type HowItWorksProps = React.HTMLAttributes<HTMLElement>;

// The props for a single step card
interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  iconBgColor: string;
  dotColor: string;
}

/**
 * A single step card within the "How It Works" section.
 * It displays an icon, title, description, and a list of benefits.
 */
const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
  color,
  iconBgColor,
  dotColor,
}) => {
  const titleWords = title.split(" ");
  const firstWord = titleWords[0];
  const restOfTitle = titleWords.slice(1).join(" ");

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
        "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted"
      )}
    >
      {/* Icon */}
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-lg", iconBgColor)}>
        <div className={color}>
          {icon}
        </div>
      </div>
      {/* Title and Description */}
      <h3 className="mb-2 text-xl font-semibold">
        <span className={color}>{firstWord}</span>
        {restOfTitle && <span> {restOfTitle}</span>}
      </h3>
      <p className="mb-6 text-muted-foreground">{description}</p>
      {/* Benefits List */}
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", iconBgColor)}>
              <div className={cn("h-2 w-2 rounded-full", dotColor)}></div>
            </div>
            <span className="text-muted-foreground">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * A responsive "How It Works" section that displays a 3-step process.
 * It is styled with shadcn/ui theme variables to support light and dark modes.
 */
export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const t = useTranslations("landing.howItWorks");

  const stepsData = [
    {
      icon: <Search className="h-6 w-6" />,
      title: t('steps.discover.title'),
      description: t('steps.discover.description'),
      benefits: t.raw('steps.discover.benefits') as string[],
      color: "text-violet-500",
      iconBgColor: "bg-violet-500/20",
      dotColor: "bg-violet-500",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('steps.getBadge.title'),
      description: t('steps.getBadge.description'),
      benefits: t.raw('steps.getBadge.benefits') as string[],
      color: "text-fuchsia-500",
      iconBgColor: "bg-fuchsia-500/20",
      dotColor: "bg-fuchsia-500",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: t('steps.enjoyBenefits.title'),
      description: t('steps.enjoyBenefits.description'),
      benefits: t.raw('steps.enjoyBenefits.benefits') as string[],
      color: "text-indigo-500",
      iconBgColor: "bg-indigo-500/20",
      dotColor: "bg-indigo-500",
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("w-full py-16 sm:py-24", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-6xl text-center">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="mb-4"
            textClassName="text-3xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
          >
            {t('title')}
          </ScrollFloat>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Step Indicators with Connecting Line */}
        <div className="relative mx-auto mb-8 w-full max-w-6xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-border"
          ></div>
          {/* Use grid to align numbers with the card grid below */}
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                // Center the number within its grid column
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-muted font-semibold text-foreground ring-4 ring-background"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
              color={step.color}
              iconBgColor={step.iconBgColor}
              dotColor={step.dotColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
