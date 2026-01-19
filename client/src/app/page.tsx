"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import RotatingText from "@/components/ui/rotating-text/RotatingText";
import SpotlightCard from '@/components/ui/spotlight-card/SpotlightCard';
import ElectricBorder from '@/components/ui/electric-border/ElectricBorder';
import Squares from "@/components/ui/squares/Squares";
import { LandingNavbar } from "@/components/ui/navbar/LandingNavbar";
import { MarqueeDemo } from "@/components/ui/marquee/MarqueeDemo";
import { TrendingUp, Users, Calendar, Rocket, Shield, Globe2, Sparkles, ChevronDown } from "lucide-react";

// Mock Data
const testimonials = [
  {
    id: 1,
    author: "Marie L.",
    role: "Founder, EcoWave",
    content: "Mana Chain allowed us to create a truly engaged community. Our customers have become our best ambassadors!",
    avatar: "👩‍💼",
    brand: "EcoWave"
  },
  {
    id: 2,
    author: "Thomas K.",
    role: "Early Supporter",
    content: "I discovered incredible brands and feel truly connected to their missions. The exclusive events are amazing!",
    avatar: "👨‍💻",
    brand: "Multiple"
  },
  {
    id: 3,
    author: "Sophie R.",
    role: "CEO, TechNova",
    content: "Decentralized fundraising has opened unimaginable doors for us. Our community is our greatest asset.",
    avatar: "👩‍🔬",
    brand: "TechNova"
  }
];

const stats = [
  { label: "Active Communities", value: "847", icon: Users, color: "text-violet-400" },
  { label: "Tokens Issued", value: "12.5M", icon: Sparkles, color: "text-fuchsia-400" },
  { label: "Events Organized", value: "1,234", icon: Calendar, color: "text-indigo-400" },
  { label: "Funds Raised", value: "$8.9M", icon: TrendingUp, color: "text-cyan-400" }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  const logoSvg = "data:image/svg+xml;base64," + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#C5A028;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D4AF37;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#grad)" opacity="0.15"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="32" font-weight="900" fill="url(#grad)" filter="url(#shadow)">M</text>
    </svg>
  `);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Squares Background */}
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(139, 92, 246, 0.2)"
            squareSize={40}
            hoverFillColor="rgba(139, 92, 246, 0.3)"
          />
        </div>
      )}

      <main className="relative z-10 pointer-events-none main-with-background">
        {/* Navigation */}
          {mounted && <LandingNavbar logoSvg={logoSvg} />}

          {/* Hero Section */}
          <section id="hero" className="min-h-screen flex items-center justify-center px-6 pt-20">
            <div className="max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-[1.8fr_1fr] gap-12 lg:gap-16 items-end">
                
                {/* Left Column - Takes more space */}
                <div className="space-y-8">
                  {/* Main Headline */}
                  <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-foreground tracking-tighter leading-[1.1]" style={{
                      fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif'
                    }}>
                      Support<br />
                      <span className="whitespace-nowrap">
                        the{' '}
                        <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                          brands
                        </span>
                        {' '}you
                      </span>
                      <br />
                      believe in.
                    </h1>
                  </div>

                  {/* Rotating Text Section */}
                  <div className={`transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">
                      <span className="text-foreground">
                        Redefine the relationship between{' '}
                      </span>
                      <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                        <RotatingText
                          texts={['brands', 'creators', 'artists', 'companies']}
                          rotationInterval={2500}
                          staggerDuration={0.02}
                          staggerFrom="first"
                          splitBy="characters"
                          className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                          elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                        />
                      </span>
                      <br />
                      <span className="text-foreground">
                        and their{' '}
                      </span>
                      <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                        <RotatingText
                          texts={['communities', 'fans', 'supporters', 'early adopters']}
                          rotationInterval={2500}
                          staggerDuration={0.02}
                          staggerFrom="first"
                          splitBy="characters"
                          className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                          elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                        />
                      </span>
                    </h2>
                  </div>

                  {/* Buttons */}
                  <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <Button variant="gradient" size="lg" className="rounded-full text-base px-8 py-6 font-semibold">
                      <Rocket className="mr-2 h-5 w-5" />
                      Create My Community
                    </Button>
                    <Button variant="gradientOutline" size="lg" className="rounded-full text-base px-8 py-6 font-semibold">
                      <Globe2 className="mr-2 h-5 w-5" />
                      Discover Projects
                    </Button>
                  </div>
                </div>

                {/* Right Column - Smaller */}
                <div className={`transition-all duration-1000 delay-300 lg:pt-16 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                  <div className="flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left">
                    {/* Brand Name */}
                    <div>
                      <h3 className="text-5xl md:text-6xl font-bold mb-3" style={{
                        background: 'linear-gradient(to right, #FFD700, #FFC700, #FFD700)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        Mana <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Chain</span>
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Issue a <span style={{ color: '#FFD700' }} className="font-semibold">community token</span>, 
                      raise funds in a <span className="text-violet-400 font-semibold">decentralized</span> way, 
                      and offer a new form of authentic engagement.
                    </p>

                    {/* Decorative elements */}
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-400/50"></div>
                      <div className="w-2 h-2 rounded-full bg-fuchsia-400/50"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400/50"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className={`flex justify-center animate-bounce transition-all duration-1000 delay-800 mt-16 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronDown className="h-8 w-8 text-violet-400" />
              </div>
            </div>
          </section>

        {/* Stats Section */}
        <section className="py-12 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <ElectricBorder
                  key={index}
                  color={
                    stat.color.includes('violet') ? '#7E22CE' :
                    stat.color.includes('fuchsia') ? '#C026D3' :
                    stat.color.includes('indigo') ? '#4338CA' :
                    '#06B6D4'
                  }
                  speed={1}
                  chaos={0.12}
                  borderRadius={16}
                  className="h-full"
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="bg-card p-4 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                    <stat.icon className={`h-8 w-8 ${stat.color} mb-2`} />
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </ElectricBorder>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
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
                How It Works
              </ScrollFloat>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  number: "1",
                  title: "Create Your Token",
                  description: "In just a few clicks, issue your symbolic support token. Simplified process, no technical skills required.",
                  color: "#7E22CE",
                  gradient: "from-violet-950 to-violet-900"
                },
                {
                  number: "2",
                  title: "Unite Community",
                  description: "Share your project and bring your supporters together. Discussion channels, voting, exclusive events.",
                  color: "#C026D3",
                  gradient: "from-fuchsia-950 to-fuchsia-900"
                },
                {
                  number: "3",
                  title: "Generate Revenue",
                  description: "Transform engagement into value. Tokenization campaigns, premium subscriptions, secondary transactions.",
                  color: "#4338CA",
                  gradient: "from-indigo-950 to-indigo-900"
                }
              ].map((item, index) => (
                <div key={index}>
                  <SpotlightCard 
                    className="h-full"
                    spotlightColor={`${item.color}40`}
                  >
                    <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                      <div className="text-7xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent mb-6">
                        {item.number}
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </SpotlightCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
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
                They Trust Us
              </ScrollFloat>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Discover what our founders and supporters say
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 h-full flex flex-col"
                >
                  <div className="text-3xl mb-3">{testimonial.avatar}</div>
                  <p className="text-sm text-muted-foreground italic mb-3 flex-1">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    <Badge className="mt-2 text-xs">{testimonial.brand}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
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
              {[
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
              ].map((faq, index) => (
                  <div
                    key={index}
                    className="w-full rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-accent/50 transition-colors">
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
                      <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted by World-Class Brands */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-2">
              Trusted by World-Class Brands
            </h3>
          </div>
          <MarqueeDemo />
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ 
                  background: 'linear-gradient(to right, #FFD700, #FFC700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Mana Chain
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Redefining community engagement, one brand at a time.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-violet-400 mb-3 text-sm">Platform</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors">How It Works</a></li>
                  <li><a href="/discover" className="hover:text-foreground transition-colors">Discover</a></li>
                  <li><a href="/login" className="hover:text-foreground transition-colors">Login</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-fuchsia-400 mb-3 text-sm">Resources</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-indigo-400 mb-3 text-sm">Follow Us</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 text-center">
              <p className="text-muted-foreground text-xs">
                © 2026 Mana Chain. Redefining community engagement together.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Legal</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
