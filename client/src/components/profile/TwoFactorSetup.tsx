"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTwoFactorSetup, useTwoFactorEnable } from "@/hooks/api/useAuth";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { ShieldCheck, Copy, Check } from "lucide-react";

type Step = "start" | "scan" | "recovery-codes";

export interface TwoFactorSetupProps {
  /** Appelé une fois les codes de récupération confirmés (2FA actif). */
  onCompleted: () => void;
}

export function TwoFactorSetup({ onCompleted }: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>("start");
  const [secret, setSecret] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const setup = useTwoFactorSetup();
  const enable = useTwoFactorEnable();

  const handleStart = () => {
    setup.mutate(undefined, {
      onSuccess: (data) => {
        setSecret(data.secret);
        setOtpauthUri(data.otpauthUri);
        setStep("scan");
      },
    });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    enable.mutate(
      { data: { code } },
      {
        onSuccess: (data) => {
          setRecoveryCodes(data.recoveryCodes);
          setStep("recovery-codes");
        },
        onSettled: () => setCode(""),
      },
    );
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "start") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Two-factor authentication adds a second step to sign-in: after your password, you&apos;ll
          also need a 6-digit code from an authenticator app (Google Authenticator, Authy,
          1Password, etc.).
        </p>
        <Button type="button" size="sm" className="gap-2" onClick={handleStart} disabled={setup.isPending}>
          <ShieldCheck className="w-4 h-4" />
          {setup.isPending ? "Starting…" : "Set up two-factor authentication"}
        </Button>
      </div>
    );
  }

  if (step === "scan") {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
        </p>
        <div className="flex justify-center rounded-lg bg-white p-4 w-fit">
          <QRCodeSVG value={otpauthUri} size={180} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Can&apos;t scan it? Enter this code manually:</p>
          <button
            type="button"
            onClick={handleCopySecret}
            className="inline-flex items-center gap-2 font-mono text-sm bg-muted px-3 py-1.5 rounded-md hover:bg-muted/70 transition-colors"
          >
            {secret}
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div>
          <label htmlFor="totp-code" className="block text-sm font-medium text-foreground mb-1">
            6-digit code
          </label>
          <OtpInput id="totp-code" value={code} onChange={setCode} autoFocus disabled={enable.isPending} />
        </div>
        <Button type="submit" size="sm" disabled={code.length !== 6 || enable.isPending}>
          {enable.isPending ? "Verifying…" : "Enable two-factor authentication"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
        Save these recovery codes somewhere safe. Each one can be used once to sign in if you
        lose access to your authenticator app — they won&apos;t be shown again.
      </div>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {recoveryCodes.map((rc) => (
          <li key={rc} className="bg-muted rounded-md px-3 py-1.5 text-center">
            {rc}
          </li>
        ))}
      </ul>
      <Button type="button" size="sm" onClick={onCompleted}>
        I&apos;ve saved my recovery codes
      </Button>
    </div>
  );
}
