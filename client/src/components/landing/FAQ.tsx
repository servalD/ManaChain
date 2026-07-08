"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import { ChevronDown } from "lucide-react";

const faqColors = [
  "#7E22CE",
  "#C026D3",
  "#4338CA",
  "#D946EF",
  "#7E22CE",
  "#4338CA",
  "#7E22CE",
  "#C026D3",
];

export function FAQ() {
  const t = useTranslations("landing.faq");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = (t.raw("items") as { question: string; answer: string }[]).map(
    (item, index) => ({ ...item, color: faqColors[index % faqColors.length] })
  );

  return (
    <section id="faq" className="py-20 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
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
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="w-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full p-4 text-left flex justify-between items-center hover:bg-accent/50 transition-colors pointer-events-auto">
                <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                <ChevronDown 
                  className={`h-5 w-5 text-violet-400 transition-transform duration-300 ${
                    openFaqIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-4 pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
