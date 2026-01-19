"use client";

import { useState } from "react";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is a community token?",
      answer: "A community token is a fractionable digital representation of your brand or project. It allows your supporters to show their engagement and benefit from exclusive advantages, while helping you raise funds in an innovative way.",
      color: "#7E22CE"
    },
    {
      question: "How can I create my token?",
      answer: "Creation is simple and fast! Sign up, fill in your brand information, customize your token (name, symbol, supply), and launch your community in minutes. No technical skills required.",
      color: "#C026D3"
    },
    {
      question: "How do supporters benefit?",
      answer: "Token holders access exclusive events, discounts, votes on brand decisions, and can even see the value of their tokens increase with your project's success. It's a win-win engagement!",
      color: "#4338CA"
    },
    {
      question: "Is it secure?",
      answer: "Absolutely! We use blockchain technology to ensure security, transparency and traceability of all transactions. Your tokens and funds are protected by audited smart contracts.",
      color: "#D946EF"
    }
  ];

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
            Frequently Asked Questions
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
