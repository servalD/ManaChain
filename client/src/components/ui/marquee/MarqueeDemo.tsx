"use client";

import { Marquee } from "@/components/ui/marquee"

const Logos = {
  nike: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-3">
      <svg
        className="h-[28px] w-auto fill-foreground"
        viewBox="0 0 1000 356.39"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M245.8 114.21l-140.5 211.14c-8.43 12.69-24.81 15.74-36.62 6.81-10.63-8.05-12.44-24.84-4.02-37.53L330.59 0l-84.79 114.21z"/>
      </svg>
      <span className="text-foreground">Nike</span>
    </div>
  ),
  adidas: () => (
    <div className="h-fit flex items-center justify-start font-bold text-2xl gap-3">
      <svg
        className="h-[32px] w-auto fill-foreground"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="19.5 27 9 31 5 25 15.5 21"/>
        <polygon points="25 23.5 14.5 27.5 10.5 21.5 21 17.5"/>
        <polygon points="30.5 20 20 24 16 18 26.5 14"/>
        <polygon points="36 16.5 25.5 20.5 21.5 14.5 32 10.5"/>
      </svg>
      <span className="text-foreground">Adidas</span>
    </div>
  ),
  bmw: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-3">
      <svg
        className="h-[32px] w-auto"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="#000" strokeWidth="2" className="dark:stroke-white stroke-gray-900"/>
        <path d="M50,2 A48,48 0 0,1 50,98 A48,48 0 0,1 50,2 M50,10 A40,40 0 0,0 50,90 Z" fill="#0066B1"/>
        <path d="M50,10 A40,40 0 0,1 50,90 Z" className="fill-foreground"/>
        <circle cx="50" cy="50" r="17" fill="none" stroke="#000" strokeWidth="2" className="dark:stroke-white stroke-gray-900"/>
      </svg>
      <span className="text-foreground">BMW</span>
    </div>
  ),
  mercedes: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-3">
      <svg
        className="h-[32px] w-auto"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground"/>
        <path d="M50,10 L50,50 L80,70 M50,50 L20,70 M50,50" stroke="currentColor" strokeWidth="3" fill="none" className="text-foreground"/>
      </svg>
      <span className="text-foreground">Mercedes-Benz</span>
    </div>
  ),
  gucci: () => (
    <div className="h-fit flex items-center justify-start font-bold text-2xl gap-2" style={{ fontFamily: 'serif' }}>
      <span className="text-foreground" style={{ letterSpacing: '0.1em' }}>GUCCI</span>
    </div>
  ),
  prada: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-2" style={{ fontFamily: 'serif' }}>
      <span className="text-foreground" style={{ letterSpacing: '0.15em', fontWeight: 300 }}>PRADA</span>
    </div>
  ),
  tesla: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-3">
      <svg
        className="h-[24px] w-auto fill-foreground"
        viewBox="0 0 342 35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 .1a9.7 9.7 0 007 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 007-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 006-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 00-8.7 7h39.9V13.9h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 13.8h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 14.1h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zM308.5 7h26a9.6 9.6 0 007-7h-40a9.6 9.6 0 007 7z"/>
      </svg>
      <span className="text-foreground">Tesla</span>
    </div>
  ),
  apple: () => (
    <div className="h-fit flex items-center justify-start font-bold text-xl gap-3">
      <svg
        className="h-[28px] w-auto fill-foreground"
        viewBox="0 0 814 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
      </svg>
      <span className="text-foreground">Apple</span>
    </div>
  ),
};

export function MarqueeDemo() {
  const arr = [
    Logos.nike,
    Logos.adidas,
    Logos.bmw,
    Logos.mercedes,
    Logos.gucci,
    Logos.prada,
    Logos.tesla,
    Logos.apple
  ]

  return (
    <Marquee pauseOnHover speed={40}>
      {arr.map((Logo, index) => (
        <div
          key={index}
          className="relative h-full w-fit mx-16 flex items-center justify-start"
        >
          <Logo />
        </div>
      ))}
    </Marquee>
  )
}
