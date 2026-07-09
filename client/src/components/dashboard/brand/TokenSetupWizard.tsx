"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { useReadContract } from "wagmi";
import { Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PinataService from "@/services/pinata.service";
import { toast } from "@/lib/toast";
import { useBrandSetupState } from "@/hooks/web3/useBrandSetupState";
import { useTxFlow } from "@/hooks/web3/useTxFlow";
import { brandFactoryAbi, brandGenesisNftAbi, fractionalVaultAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";
import { getTokensControllerByBrandQueryKey } from "@/api/generated/endpoints/tokens/tokens";

const GENESIS_TOKEN_ID = BigInt(1);

interface TokenSetupWizardProps {
  brandId: string;
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Wizard de déploiement du module marque, en 3 transactions signées : voir
 * `temp-plan/phase-3-front-flows.md`. État dérivé de `useBrandSetupState`
 * (chaîne) — reprise gratuite après refresh ou échec en cours de route.
 */
export function TokenSetupWizard({ brandId }: TokenSetupWizardProps) {
  const setup = useBrandSetupState();
  const queryClient = useQueryClient();

  if (!setup.address) {
    return (
      <StepShell
        title="Connect your wallet"
        description="Connect the wallet linked to your account to deploy your token module."
      >
        <p className="text-sm text-muted-foreground">
          Use the wallet button in the navbar above.
        </p>
      </StepShell>
    );
  }

  if (setup.step === "not-whitelisted") {
    return (
      <StepShell
        title="Waiting for whitelist"
        description="An admin needs to whitelist your wallet on-chain before you can deploy your token module."
      >
        <p className="text-sm text-muted-foreground">
          This usually happens shortly after your brand application is approved. Check back soon.
        </p>
      </StepShell>
    );
  }

  if (setup.step === "deploy") {
    return <DeployStep brandAddress={setup.address} onDeployed={setup.refetchAll} />;
  }

  if (setup.step === "genesis") {
    return (
      <GenesisStep
        brandAddress={setup.address}
        genesisNftAddress={setup.genesisNftAddress}
        vaultAddress={setup.vaultAddress}
        onDeposited={setup.refetchAll}
      />
    );
  }

  if (setup.step === "sale") {
    return (
      <SaleStep
        vaultAddress={setup.vaultAddress}
        onOpened={async () => {
          await setup.refetchAll();
          await queryClient.invalidateQueries({
            queryKey: getTokensControllerByBrandQueryKey(brandId),
          });
        }}
      />
    );
  }

  return null; // setup.step === "done": the caller shows the real token panel instead.
}

function DeployStep({
  brandAddress,
  onDeployed,
}: {
  brandAddress: `0x${string}`;
  onDeployed: () => Promise<void>;
}) {
  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupplyCap, setTotalSupplyCap] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const deployFlow = useTxFlow({
    abi: brandFactoryAbi,
    address: CONTRACT_ADDRESSES.brandFactory,
    onConfirmed: async () => {
      toast({
        title: "Module deployed",
        description: "Your genesis NFT, vault and support token are live on-chain.",
        variant: "success",
      });
      await onDeployed();
    },
  });

  const isBusy = deployFlow.status === "signing" || deployFlow.status === "pending" || isUploadingLogo;

  const handleDeploy = async () => {
    if (!nftName.trim() || !nftSymbol.trim() || !tokenName.trim() || !tokenSymbol.trim()) {
      toast({ title: "Missing fields", description: "Fill in all fields before deploying.", variant: "error" });
      return;
    }

    let tokenImageURI = "";
    if (logoFile) {
      setIsUploadingLogo(true);
      try {
        tokenImageURI = await PinataService.uploadFile(logoFile);
      } catch {
        setIsUploadingLogo(false);
        return; // PinataService already toasts on failure.
      }
      setIsUploadingLogo(false);
    }

    const cap = totalSupplyCap.trim() ? parseUnits(totalSupplyCap.trim(), 18) : BigInt(0);
    await deployFlow.write("deployBrandModule", [
      brandAddress,
      nftName.trim(),
      nftSymbol.trim(),
      tokenName.trim(),
      tokenSymbol.trim(),
      tokenImageURI,
      cap,
    ]);
  };

  return (
    <StepShell
      title="Step 1 — Deploy your token module"
      description="Your genesis NFT, fractional vault and support token are deployed together, in one transaction."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Genesis NFT name</label>
          <Input value={nftName} onChange={(e) => setNftName(e.target.value)} placeholder="My Brand Genesis" disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Genesis NFT symbol</label>
          <Input value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value.toUpperCase())} placeholder="MBG" disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Support token name</label>
          <Input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="My Brand Token" disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Support token symbol</label>
          <Input value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())} placeholder="MBT" disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Total supply cap (optional)</label>
          <Input
            type="number"
            value={totalSupplyCap}
            onChange={(e) => setTotalSupplyCap(e.target.value)}
            placeholder="Unlimited"
            disabled={isBusy}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Support token logo (optional)</label>
          <input
            type="file"
            accept="image/*"
            disabled={isBusy}
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
          />
        </div>
      </div>
      <Button onClick={handleDeploy} disabled={isBusy} className="w-full">
        {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {deployFlow.status === "signing" || deployFlow.status === "pending"
          ? "Confirming…"
          : isUploadingLogo
            ? "Uploading logo…"
            : "Deploy token module"}
      </Button>
      {deployFlow.status === "failed" && deployFlow.error && (
        <p className="text-sm text-destructive">{deployFlow.error.message}</p>
      )}
    </StepShell>
  );
}

function GenesisStep({
  brandAddress,
  genesisNftAddress,
  vaultAddress,
  onDeposited,
}: {
  brandAddress: `0x${string}`;
  genesisNftAddress: `0x${string}` | undefined;
  vaultAddress: `0x${string}` | undefined;
  onDeposited: () => Promise<void>;
}) {
  const ownerQuery = useReadContract({
    address: genesisNftAddress,
    abi: brandGenesisNftAbi,
    functionName: "ownerOf",
    args: [GENESIS_TOKEN_ID],
    query: { enabled: !!genesisNftAddress, retry: false },
  });
  const approvedQuery = useReadContract({
    address: genesisNftAddress,
    abi: brandGenesisNftAbi,
    functionName: "getApproved",
    args: [GENESIS_TOKEN_ID],
    query: { enabled: !!genesisNftAddress && ownerQuery.data === brandAddress },
  });

  const isMinted = ownerQuery.data === brandAddress;
  const isApproved = isMinted && approvedQuery.data === vaultAddress;

  const genesisNftFlow = useTxFlow({
    abi: brandGenesisNftAbi,
    address: genesisNftAddress,
    onConfirmed: async () => {
      await Promise.all([ownerQuery.refetch(), approvedQuery.refetch()]);
    },
  });
  const vaultFlow = useTxFlow({
    abi: fractionalVaultAbi,
    address: vaultAddress,
    onConfirmed: async () => {
      toast({
        title: "Genesis locked",
        description: "Your genesis NFT is now locked in the vault. Ready to open your sale.",
        variant: "success",
      });
      await onDeposited();
    },
  });

  const isGenesisBusy = genesisNftFlow.status === "signing" || genesisNftFlow.status === "pending";
  const isVaultBusy = vaultFlow.status === "signing" || vaultFlow.status === "pending";

  return (
    <StepShell
      title="Step 2 — Lock your genesis NFT"
      description="Mint the genesis NFT, approve the vault, then deposit it — the vault fractionalizes it into your support token supply."
    >
      <div className="space-y-3">
        <SubStepRow
          done={isMinted}
          busy={isGenesisBusy && !isMinted}
          label="Mint genesis NFT"
          action={
            <Button
              size="sm"
              disabled={isMinted || isGenesisBusy || !genesisNftAddress}
              onClick={() => genesisNftFlow.write("mint", [brandAddress, GENESIS_TOKEN_ID, "", ""])}
            >
              Mint
            </Button>
          }
        />
        <SubStepRow
          done={isApproved}
          busy={isGenesisBusy && isMinted && !isApproved}
          label="Approve vault to transfer it"
          action={
            <Button
              size="sm"
              disabled={!isMinted || isApproved || isGenesisBusy || !vaultAddress}
              onClick={() => vaultAddress && genesisNftFlow.write("approve", [vaultAddress, GENESIS_TOKEN_ID])}
            >
              Approve
            </Button>
          }
        />
        <SubStepRow
          done={false}
          busy={isVaultBusy}
          label="Deposit into the vault"
          action={
            <Button
              size="sm"
              disabled={!isApproved || isVaultBusy || !genesisNftAddress}
              onClick={() =>
                genesisNftAddress && vaultFlow.write("depositGenesis", [genesisNftAddress, GENESIS_TOKEN_ID])
              }
            >
              Deposit
            </Button>
          }
        />
      </div>
      {(genesisNftFlow.status === "failed" && genesisNftFlow.error) && (
        <p className="text-sm text-destructive">{genesisNftFlow.error.message}</p>
      )}
      {(vaultFlow.status === "failed" && vaultFlow.error) && (
        <p className="text-sm text-destructive">{vaultFlow.error.message}</p>
      )}
    </StepShell>
  );
}

function SubStepRow({
  done,
  busy,
  label,
  action,
}: {
  done: boolean;
  busy: boolean;
  label: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
        ) : (
          <div className="h-4 w-4 rounded-full border border-border" />
        )}
        <span className={done ? "text-sm text-muted-foreground line-through" : "text-sm"}>{label}</span>
      </div>
      {!done && action}
    </div>
  );
}

function SaleStep({
  vaultAddress,
  onOpened,
}: {
  vaultAddress: `0x${string}` | undefined;
  onOpened: () => Promise<void>;
}) {
  const [pricePerToken, setPricePerToken] = useState("");
  const [totalForSale, setTotalForSale] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const openSaleFlow = useTxFlow({
    abi: fractionalVaultAbi,
    address: vaultAddress,
    onConfirmed: async () => {
      toast({
        title: "Sale opened",
        description: "Your support token sale is now live.",
        variant: "success",
      });
      await onOpened();
    },
  });

  const isBusy = openSaleFlow.status === "signing" || openSaleFlow.status === "pending";

  const handleOpenSale = async () => {
    if (!pricePerToken.trim() || !totalForSale.trim() || !startAt || !endAt) {
      toast({ title: "Missing fields", description: "Fill in all fields before opening the sale.", variant: "error" });
      return;
    }
    const start = BigInt(Math.floor(new Date(startAt).getTime() / 1000));
    const end = BigInt(Math.floor(new Date(endAt).getTime() / 1000));
    if (end <= start) {
      toast({ title: "Invalid window", description: "End time must be after start time.", variant: "error" });
      return;
    }
    await openSaleFlow.write("openSale", [
      CONTRACT_ADDRESSES.saleFactory,
      parseUnits(pricePerToken.trim(), 6),
      parseUnits(totalForSale.trim(), 18),
      start,
      end,
    ]);
  };

  return (
    <StepShell
      title="Step 3 — Open your token sale"
      description="One transaction: deploys the sale escrow, mints the tokens for sale into it, and links it to your vault."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Price per token (USDC)</label>
          <Input
            type="number"
            step="0.01"
            value={pricePerToken}
            onChange={(e) => setPricePerToken(e.target.value)}
            placeholder="2.50"
            disabled={isBusy}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Tokens for sale</label>
          <Input
            type="number"
            value={totalForSale}
            onChange={(e) => setTotalForSale(e.target.value)}
            placeholder="10000"
            disabled={isBusy}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Start</label>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={isBusy} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">End</label>
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={isBusy} />
        </div>
      </div>
      <Button onClick={handleOpenSale} disabled={isBusy || !vaultAddress} className="w-full">
        {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2 opacity-0" />}
        {isBusy ? "Confirming…" : "Open sale"}
      </Button>
      {openSaleFlow.status === "failed" && openSaleFlow.error && (
        <p className="text-sm text-destructive">{openSaleFlow.error.message}</p>
      )}
    </StepShell>
  );
}
