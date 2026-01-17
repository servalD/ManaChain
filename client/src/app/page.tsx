"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScrollFloat from "@/components/ui/scroll-float/scroll-float";
import RotatingText from "@/components/ui/rotating-text/RotatingText";
import StarBorder from "@/components/ui/star-border/StarBorder";
import SpotlightCard from '@/components/ui/spotlight-card/SpotlightCard';
import ElectricBorder from '@/components/ui/electric-border/ElectricBorder';
import LiquidEther from "@/components/ui/liquid-ether/LiquidEther";
import PillNav from "@/components/ui/pill-nav/PillNav";
import { TrendingUp, Users, Calendar, Rocket, Heart, Zap, Shield, Globe2, Sparkles, Award, Target, ChevronDown } from "lucide-react";

// Mock Data
const featuredBrands = [
  {
    id: 1,
    name: "EcoWave",
    category: "Sustainable Fashion",
    description: "Eco-friendly clothing brand revolutionizing the textile industry",
    image: "🌊",
    tokenSymbol: "ECOW",
    holders: 12450,
    totalSupply: 1000000,
    price: "$0.45",
    raised: "$456,789",
    events: 23,
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: 2,
    name: "TechNova",
    category: "Tech Innovation",
    description: "AI startup specializing in mental health solutions",
    image: "🚀",
    tokenSymbol: "NOVA",
    holders: 8920,
    totalSupply: 750000,
    price: "$1.20",
    raised: "$1,234,567",
    events: 18,
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: 3,
    name: "CaféCulture",
    category: "Gastronomy",
    description: "Artisan coffee chain with fair trade practices",
    image: "☕",
    tokenSymbol: "CAFE",
    holders: 15670,
    totalSupply: 2000000,
    price: "$0.32",
    raised: "$687,432",
    events: 45,
    color: "from-amber-500 to-orange-600"
  },
  {
    id: 4,
    name: "ArtisanCraft",
    category: "Handicraft",
    description: "Marketplace for local artisans and independent creators",
    image: "🎨",
    tokenSymbol: "CRAFT",
    holders: 6340,
    totalSupply: 500000,
    price: "$0.89",
    raised: "$289,123",
    events: 12,
    color: "from-purple-500 to-pink-600"
  },
  {
    id: 5,
    name: "FitLife",
    category: "Wellness",
    description: "Personalized sports coaching app with community features",
    image: "💪",
    tokenSymbol: "FIT",
    holders: 18920,
    totalSupply: 1500000,
    price: "$0.67",
    raised: "$823,456",
    events: 34,
    color: "from-red-500 to-rose-600"
  },
  {
    id: 6,
    name: "GreenEnergy",
    category: "Renewable Energy",
    description: "Solar solutions for individuals and businesses",
    image: "⚡",
    tokenSymbol: "GREEN",
    holders: 9870,
    totalSupply: 800000,
    price: "$1.45",
    raised: "$1,456,890",
    events: 21,
    color: "from-lime-500 to-green-600"
  }
];

const upcomingEvents = [
  {
    id: 1,
    brand: "EcoWave",
    title: "Summer 2026 Collection Launch",
    date: "February 15, 2026",
    attendees: 450,
    type: "Product Launch",
    tokenReward: "+50 ECOW",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: 2,
    brand: "TechNova",
    title: "Webinar: AI & Mental Health",
    date: "February 20, 2026",
    attendees: 780,
    type: "Training",
    tokenReward: "+25 NOVA",
    icon: Zap,
    color: "from-blue-500 to-indigo-500"
  },
  {
    id: 3,
    brand: "CaféCulture",
    title: "Exclusive Tasting in Paris",
    date: "February 28, 2026",
    attendees: 120,
    type: "Physical Event",
    tokenReward: "+100 CAFE",
    icon: Award,
    color: "from-amber-500 to-orange-500"
  },
  {
    id: 4,
    brand: "FitLife",
    title: "Virtual 10km Marathon",
    date: "March 5, 2026",
    attendees: 2340,
    type: "Community Challenge",
    tokenReward: "+75 FIT",
    icon: Target,
    color: "from-red-500 to-rose-500"
  }
];

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
  
  // Logo SVG en base64 - M stylisé avec gradient metallic gold
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* LiquidEther Background */}
      {mounted && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LiquidEther
            colors={['#7c3aed', '#a855f7', '#ec4899', '#3b82f6', '#06b6d4']}
            mouseForce={80}
            cursorSize={150}
            autoDemo={true}
            autoSpeed={0.3}
            autoIntensity={1.2}
            takeoverDuration={0.3}
            autoResumeDelay={2000}
            resolution={0.5}
            className="w-full h-full pointer-events-auto"
            style={{ opacity: 0.4 }}
          />
        </div>
      )}

      <main className="relative z-10 pointer-events-auto">
        {/* Navigation */}
          {mounted && (
            <div className="fixed top-0 w-full z-50 flex justify-center pt-6 px-6">
              <PillNav
                logo={logoSvg}
                logoAlt="Mana Chain"
                items={[
                  { label: 'Home', href: '#hero' },
                  { label: 'Brands', href: '#brands' },
                  { label: 'Events', href: '#events' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Login', href: '/login' }
                ]}
                baseColor="#D4AF37"
                pillColor="#FFFFFF"
                hoveredPillTextColor="#1F2937"
                pillTextColor="#D4AF37"
                ease="power2.easeOut"
              />
            </div>
          )}

        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-7xl mx-auto text-center">
            <div className={`mb-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-6xl md:text-8xl font-bold mb-3" style={{ 
                background: 'linear-gradient(to right, #FFD700, #FFC700, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Mana Chain
              </h1>
              <Badge variant="gradient" className="text-xs md:text-sm px-3 py-1.5">
                🌟 Community Engagement Platform
              </Badge>
            </div>
            
            <h2 className={`text-2xl md:text-5xl font-bold mb-6 leading-[1.15] transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="bg-gradient-to-r from-gray-50 via-gray-200 to-gray-100 bg-clip-text text-transparent">
                Redefine the relationship between{' '}
              </span>
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                <RotatingText
                  texts={['brands', 'creators', 'artists', 'companies']}
                  rotationInterval={2500}
                  staggerDuration={0.02}
                  staggerFrom="first"
                  splitBy="characters"
                  className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                  elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                />
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-50 via-gray-200 to-gray-100 bg-clip-text text-transparent">
                and their{' '}
              </span>
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent inline-block">
                <RotatingText
                  texts={['communities', 'fans', 'supporters', 'early adopters']}
                  rotationInterval={2500}
                  staggerDuration={0.02}
                  staggerFrom="first"
                  splitBy="characters"
                  className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                  elementLevelClassName="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                />
              </span>
          </h2>
            
            <p className={`text-base md:text-lg text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Allow any business to issue a <span style={{ color: '#FFD700' }} className="font-semibold">community token</span>, 
              raise funds in a <span className="text-violet-400 font-semibold">decentralized</span> way, 
              and offer a new form of authentic engagement.
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center mb-8 transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Button variant="gradient" size="lg" className="rounded-full text-base px-6 py-5">
                <Rocket className="mr-2 h-4 w-4" />
                Create My Community
              </Button>
              <Button variant="gradientOutline" size="lg" className="rounded-full text-base px-6 py-5">
                <Globe2 className="mr-2 h-4 w-4" />
                Discover Projects
              </Button>
            </div>

            {/* Scroll Indicator */}
            <div className={`flex justify-center animate-bounce transition-all duration-1000 delay-800 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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
                  <div className="bg-gradient-to-br from-black via-gray-950 to-black p-4 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                    <stat.icon className={`h-8 w-8 ${stat.color} mb-2`} />
                    <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                </ElectricBorder>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Brands Section */}
        <section id="brands" className="py-20 px-6 relative">
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
                Featured Brands
              </ScrollFloat>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Discover innovative projects and emerging brands shaping the future
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredBrands.map((brand, index) => (
                <StarBorder
                  key={brand.id}
                  as="div"
                  color={brand.id % 2 === 0 ? "#7E22CE" : "#C026D3"}
                  speed="4s"
                  thickness={2}
                  className="w-full"
                >
                  <div className="p-4 bg-gradient-to-br from-violet-950/50 to-fuchsia-950/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">{brand.image}</div>
                      <Badge className="text-xs">{brand.category}</Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {brand.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{brand.description}</p>
                    
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Token</span>
                        <span className="font-mono text-violet-400">${brand.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Price</span>
                        <span className="font-semibold text-gray-200">{brand.price}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Holders</span>
                        <span className="font-semibold">{brand.holders.toLocaleString('en-US')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Raised</span>
                        <span className="font-semibold" style={{ color: '#FFD700' }}>{brand.raised}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Events</span>
                        <span className="font-semibold">{brand.events}</span>
                      </div>
                    </div>
                    
                    <Button variant="gradient" className="w-full rounded-full" size="sm">
                      <Heart className="mr-2 h-3 w-3" />
                      Join
                    </Button>
                  </div>
                </StarBorder>
              ))}
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section id="events" className="py-20 px-6 relative">
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
                Upcoming Events
              </ScrollFloat>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Participate in exclusive events organized by your favorite brands
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => {
                const EventIcon = event.icon;
                return (
                  <StarBorder
                    key={event.id}
                    as="div"
                    color="#7E22CE"
                    speed="5s"
                    thickness={2}
                    className="w-full"
                  >
                    <div className="p-5 bg-gradient-to-br from-violet-950/40 to-fuchsia-950/40 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${event.color} bg-opacity-10 backdrop-blur-sm`}>
                          <EventIcon className={`h-6 w-6 bg-gradient-to-br ${event.color} bg-clip-text text-transparent`} style={{
                            filter: 'drop-shadow(0 0 8px currentColor)'
                          }} />
                        </div>
                        <Badge className="text-xs border font-semibold" style={{ 
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          color: '#D4AF37',
                          borderColor: 'rgba(212, 175, 55, 0.3)'
                        }}>
                          {event.tokenReward}
                        </Badge>
                      </div>
                      
                      <div className="text-xs font-semibold mb-2" style={{ color: '#D4AF37' }}>{event.brand}</div>
                      <h3 className="text-lg font-bold mb-3 group-hover:text-violet-300 transition-colors">{event.title}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-300">
                          <Calendar className="mr-2 h-4 w-4 text-violet-400" />
                          {event.date}
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <Users className="mr-2 h-4 w-4 text-fuchsia-400" />
                          <span className="font-semibold text-white">{event.attendees}</span>
                          <span className="ml-1">registered</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-300">
                          {event.type}
                        </Badge>
                      </div>
                      
                      <Button variant="gradient" className="w-full rounded-full group-hover:shadow-lg group-hover:shadow-violet-500/20 transition-shadow" size="sm">
                        <Rocket className="mr-2 h-3 w-3" />
                        Register Now
                      </Button>
                    </div>
                  </StarBorder>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-20 px-6 relative">
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
                Our Mission
              </ScrollFloat>
              <p className="text-base md:text-lg text-gray-300 max-w-4xl mx-auto mb-6">
                Bring communities together around a common interest, create real engagement, 
                and spotlight emerging or established brands.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: "Authentic Engagement",
                  description: "Transform every supporter into an actor in your brand's success. Create a lasting and emotional bond with your community.",
                  color: "#7E22CE",
                  iconColor: "text-violet-400",
                  titleColor: "text-violet-300",
                  gradient: "from-violet-950 to-violet-900"
                },
                {
                  icon: Sparkles,
                  title: "Community Tokens",
                  description: "Issue a symbolic support token, fractionable and accessible to all. More than a like, a true representation of engagement.",
                  color: "#C026D3",
                  iconColor: "text-fuchsia-400",
                  titleColor: "text-fuchsia-300",
                  gradient: "from-fuchsia-950 to-fuchsia-900"
                },
                {
                  icon: Shield,
                  title: "Simplified Web3",
                  description: "An experience designed for non-technical users. Smooth onboarding, without technical jargon or complexity.",
                  color: "#4338CA",
                  iconColor: "text-indigo-400",
                  titleColor: "text-indigo-300",
                  gradient: "from-indigo-950 to-indigo-900"
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index}>
                    <SpotlightCard 
                      className="h-full"
                      spotlightColor={`${item.color}40`}
                    >
                      <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                        <Icon className={`h-16 w-16 ${item.iconColor} mb-6`} />
                        <h3 className={`text-2xl font-bold ${item.titleColor} mb-4`}>{item.title}</h3>
                        <p className="text-base text-gray-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </SpotlightCard>
                  </div>
                );
              })}
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
                      <div className="text-7xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent mb-6">
                        {item.number}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                      <p className="text-base text-gray-300 leading-relaxed">
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
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Discover what our founders and supporters say
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {testimonials.map((testimonial) => (
                <StarBorder
                  key={testimonial.id}
                  as="div"
                  color="#7E22CE"
                  speed="4s"
                  thickness={2}
                  className="w-full"
                >
                  <div className="p-4 bg-gradient-to-br from-violet-950/50 to-fuchsia-950/50 backdrop-blur-sm h-full flex flex-col">
                    <div className="text-3xl mb-3">{testimonial.avatar}</div>
                    <p className="text-sm text-gray-300 italic mb-3 flex-1">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.author}</div>
                      <div className="text-xs text-gray-400">{testimonial.role}</div>
                      <Badge className="mt-2 text-xs">{testimonial.brand}</Badge>
                    </div>
                  </div>
                </StarBorder>
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
                <StarBorder key={index} as="div" color={faq.color} speed="4s" thickness={2} className="w-full">
                  <div className="bg-gradient-to-br from-violet-950/50 to-fuchsia-950/50 backdrop-blur-sm">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                    >
                      <h3 className="text-base font-semibold">{faq.question}</h3>
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
                      <p className="px-4 pb-4 text-sm text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </StarBorder>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <StarBorder as="div" color="#7E22CE" speed="3s" thickness={3} className="w-full">
              <div className="p-8 bg-gradient-to-br from-violet-950 via-fuchsia-950 to-indigo-950 backdrop-blur-sm">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                  Ready to Create Your Community?
                </h2>
                <p className="text-base md:text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
                  Join the hundreds of brands that have already transformed their engagement with Mana Chain
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button variant="gradient" size="lg" className="rounded-full text-base px-6 py-5">
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Now
                  </Button>
                  <Button variant="gradientOutline" size="lg" className="rounded-full text-base px-6 py-5">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule a Demo
                  </Button>
                </div>
              </div>
            </StarBorder>
          </div>
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
                <p className="text-gray-400 text-xs leading-relaxed">
                  Redefining community engagement, one brand at a time.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-violet-400 mb-3 text-sm">Platform</h4>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li><a href="#brands" className="hover:text-white transition-colors">Brands</a></li>
                  <li><a href="#events" className="hover:text-white transition-colors">Events</a></li>
                  <li><a href="#mission" className="hover:text-white transition-colors">Mission</a></li>
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-fuchsia-400 mb-3 text-sm">Resources</h4>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-indigo-400 mb-3 text-sm">Follow Us</h4>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-gray-400 text-xs">
                © 2026 Mana Chain. Redefining community engagement together.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Legal</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
