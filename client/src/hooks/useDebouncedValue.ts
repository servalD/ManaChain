"use client";

import { useEffect, useState } from "react";

/** Retourne `value` avec un retard de `delayMs` (recherche au clavier, etc.). */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
