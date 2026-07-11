"use client";

import { useEffect, useState } from "react";

/**
 * Chemin du logo ManaChain adapté au thème courant (classe `dark` sur
 * `<html>`), mis à jour en direct via MutationObserver quand l'utilisateur
 * bascule le thème.
 */
export function useThemedLogoSrc(): string {
  const [logoSrc, setLogoSrc] = useState("/Logo_ManaChain_Noir.svg");

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setLogoSrc(isDark ? "/Logo_ManaChain_Blanc.svg" : "/Logo_ManaChain_Noir.svg");
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return logoSrc;
}
