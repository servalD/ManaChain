"use client";

import { useState } from "react";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is a community badge?",
      answer:
        "A community badge is a digital representation of a brand or project. You can hold units of a badge to show your level of engagement and benefit from exclusive advantages. It does not constitute an investment.",
      color: "#7E22CE"
    },
    {
      question: "How can I create my community badge?",
      answer:
        "Creation is simple and fast! Sign up, fill in your brand information, customize your badge (name, symbol, supply), and launch your community in minutes. No technical skills required.",
      color: "#C026D3"
    },
    {
      question: "How do supporters benefit?",
      answer:
        "Badge holders (those who hold units of a brand's badge) access exclusive events, discounts, and can take part in the life of the brand (for example through votes or community interactions). Badges do not promise any financial return nor are legally binding in any way: they are a way to recognize and structure engagement over time.",
      color: "#4338CA"
    },
    {
      question: "Is it secure?",
      answer:
        "Absolutely! We use blockchain technology to ensure security, transparency and traceability of all transactions. Your badge units and funds are protected by audited smart contracts.",
      color: "#D946EF"
    },
    {
      question: "Is ManaChain a financial investment platform?",
      answer:
        "No. ManaChain is not an investment platform and community badges are not designed or presented as financial instruments or securities. They do not promise any financial return and are meant to structure symbolic, long-term engagement between brands and their communities.",
      color: "#7E22CE"
    },

    {
      question: "Do I need technical knowledge to use ManaChain?",
      answer:
        "No. The experience is designed for everyday users, not experts. You don’t need to understand blockchain, wallets, or how it works under the hood. You simply browse brands, support the ones you care about, and access the benefits defined by each brand.",
      color: "#4338CA"
    },
    {
      question: "Can I stop supporting a brand later?",
      answer:
        "Yes. You remain free to stop engaging with a brand at any time. Depending on how each project is configured, you may still hold your badge units or transfer them. In all cases, there is no obligation to continue using the platform or to maintain a specific level of support.",
      color: "#7E22CE"
    },
    {
      question: "Who can join ManaChain as a brand?",
      answer:
        "ManaChain is open to brands and projects at different stages of maturity, including those with low visibility or just starting out. The goal is to help them meet relevant audiences, structure their communities, and turn diffuse interest into a clear, long-term engagement path.",
      color: "#C026D3"
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
