"use client";

import { cn } from "@/lib/utils";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  className?: string;
}

/**
 * Champ de saisie pour un code TOTP à 6 chiffres. Un seul `<input>` (pas de
 * cases segmentées) : plus simple à gérer (focus, coller un code copié) tout
 * en restant lisible grâce à `tracking-widest` + une police plus grande.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  id,
  className,
}: OtpInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      disabled={disabled}
      maxLength={length}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
      className={cn(
        "w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 text-center text-2xl tracking-[0.5em] font-mono",
        className,
      )}
      placeholder={"0".repeat(length)}
    />
  );
}
