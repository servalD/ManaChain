"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VerifyEmail } from "@/components/verify-email";

function VerifyBrandApplicationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return <VerifyEmail token={token} type="brand" />;
}

export default function VerifyBrandApplicationPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    }>
      <VerifyBrandApplicationContent />
    </Suspense>
  );
}
