import type { PropsWithChildren } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{
        network: Network.TESTNET,
        aptosApiKeys: {
          testnet: import.meta.env.VITE_APTOS_API_KEY,
        },
      }}
      onError={(error) => {
        // Non-fatal: surface in UI elsewhere if desired
        console.error("Wallet connection error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};

