"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi, Address, ContractFunctionArgs, ContractFunctionName, TransactionReceipt } from "viem";

export type TxFlowStatus = "idle" | "signing" | "pending" | "confirmed" | "failed";

type WriteFunctionName<TAbi extends Abi> = ContractFunctionName<TAbi, "nonpayable" | "payable">;
type WriteFunctionArgs<TAbi extends Abi, TFunctionName extends WriteFunctionName<TAbi>> = ContractFunctionArgs<
  TAbi,
  "nonpayable" | "payable",
  TFunctionName
>;

interface UseTxFlowOptions<TAbi extends Abi> {
  abi: TAbi;
  address: Address;
  /** Appelé une fois la transaction minée. Invalidation de queries + polling API côté appelant. */
  onConfirmed?: (receipt: TransactionReceipt) => void | Promise<void>;
}

/**
 * Primitive d'écriture commune : writeContract -> waitForTransactionReceipt -> onConfirmed.
 * `status` est dérivé directement des états wagmi (pas de copie via setState dans un effet).
 */
export function useTxFlow<TAbi extends Abi>({ abi, address, onConfirmed }: UseTxFlowOptions<TAbi>) {
  const [writeError, setWriteError] = useState<Error | null>(null);
  const confirmedHashRef = useRef<Address | null>(null);

  const { writeContractAsync, data: hash, isPending: isSigning, reset: resetWrite } = useWriteContract();

  const {
    data: receipt,
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash, query: { enabled: !!hash } });

  useEffect(() => {
    if (!receipt || !isReceiptSuccess || confirmedHashRef.current === receipt.transactionHash) return;
    confirmedHashRef.current = receipt.transactionHash;
    void onConfirmed?.(receipt);
  }, [receipt, isReceiptSuccess, onConfirmed]);

  const status: TxFlowStatus = isSigning
    ? "signing"
    : isReceiptError
      ? "failed"
      : isReceiptSuccess
        ? "confirmed"
        : hash
          ? "pending"
          : writeError
            ? "failed"
            : "idle";

  const error = writeError ?? (receiptError instanceof Error ? receiptError : null);

  const write = useCallback(
    async <TFunctionName extends WriteFunctionName<TAbi>>(
      functionName: TFunctionName,
      args: WriteFunctionArgs<TAbi, TFunctionName>,
    ) => {
      setWriteError(null);
      confirmedHashRef.current = null;
      try {
        await writeContractAsync({ address, abi, functionName, args } as never);
      } catch (err) {
        setWriteError(err instanceof Error ? err : new Error("Failed to sign transaction"));
      }
    },
    [abi, address, writeContractAsync],
  );

  const reset = useCallback(() => {
    setWriteError(null);
    confirmedHashRef.current = null;
    resetWrite();
  }, [resetWrite]);

  return { status, error, hash, write, reset };
}
