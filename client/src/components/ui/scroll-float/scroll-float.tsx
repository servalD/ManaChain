"use client";

import React, { useEffect, useMemo, useRef, ReactNode, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    // Extraire les classes de gradient de textClassName pour les appliquer aux caractères
    const gradientClasses = textClassName.includes('bg-gradient') 
      ? textClassName.split(' ').filter(cls => cls.includes('gradient') || cls.includes('from-') || cls.includes('to-') || cls.includes('via-') || cls.includes('bg-clip')).join(' ')
      : '';
    
    // Nettoyer textClassName pour retirer les classes de gradient (elles sont sur les caractères)
    const cleanedTextClassName = textClassName.split(' ')
      .filter(cls => !cls.includes('gradient') && !cls.includes('from-') && !cls.includes('to-') && !cls.includes('via-') && !cls.includes('bg-clip'))
      .join(' ');
    
    return {
      chars: text.split('').map((char, index) => (
        <span className={`char ${gradientClasses}`} key={index}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      )),
      className: cleanedTextClassName
    };
  }, [children, textClassName]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    const charElements = el.querySelectorAll('.char');

    gsap.fromTo(
      charElements,
      {
        willChange: 'opacity, transform',
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        transformOrigin: '50% 0%'
      },
      {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true
        }
      }
    );
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${splitText.className}`}>{splitText.chars}</span>
    </h2>
  );
};

export default ScrollFloat;

