"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { asAxiosError } from "@/lib/api-error";
import { http } from "viem";
import { avalancheFuji } from "viem/chains";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ReactNode } from "react";

interface Web3ProviderProps {
  children: ReactNode;
}

// Configuration Wagmi
// http() sans argument retombe sur le RPC public Fuji défini par viem/chains.
const config = createConfig({
  chains: [avalancheFuji],
  multiInjectedProviderDiscovery: false,
  transports: {
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

// Client React Query — partagé par Wagmi/Dynamic et par les hooks API générés
// (Orval). Pas de retry sur les erreurs client (401/403/404) : ces statuts ne
// changeront pas en réessayant, et retarderaient l'affichage des toasts
// d'erreur branchés dessus dans client/src/hooks/api/*.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = asAxiosError(error)?.response?.status;
        if (status !== undefined && [401, 403, 404].includes(status)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export function Web3Provider({ children }: Web3ProviderProps) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  if (!environmentId) {
    throw new Error("NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not defined in environment variables");
  }

  return (
    <DynamicContextProvider
    theme={"dark"}
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
