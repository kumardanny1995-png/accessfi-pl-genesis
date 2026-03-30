import { getOptionalEnv } from "@/lib/db/env";

export const ACCESSFI_FEATURED_VAULT_SLUG = "btc-research-club";

export function getAccessFiFlowConfig() {
  return {
    network: process.env.NEXT_PUBLIC_FLOW_NETWORK ?? "testnet",
    accessNode: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE ?? "https://rest-testnet.onflow.org",
    walletDiscovery:
      process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY ?? "https://fcl-discovery.onflow.org/testnet/authn",
    appTitle: process.env.NEXT_PUBLIC_FLOW_APP_TITLE ?? "AccessFi"
  };
}

export function getAccessFiLitConfig() {
  return {
    enabled: getOptionalEnv("ACCESSFI_LIT_ENABLED") !== "false",
    network: getOptionalEnv("ACCESSFI_LIT_NETWORK") ?? "naga-test"
  };
}

export function getAccessFiStorachaConfig() {
  return {
    spaceDid: getOptionalEnv("ACCESSFI_STORACHA_SPACE_DID"),
    proof: getOptionalEnv("ACCESSFI_STORACHA_PROOF"),
    principal: getOptionalEnv("ACCESSFI_STORACHA_PRINCIPAL"),
    gateway: getOptionalEnv("ACCESSFI_STORACHA_GATEWAY") ?? "https://storacha.link/ipfs"
  };
}

export function getAccessFiNearConfig() {
  return {
    network: getOptionalEnv("ACCESSFI_NEAR_NETWORK") ?? "testnet",
    rpcUrl: getOptionalEnv("ACCESSFI_NEAR_RPC_URL") ?? "https://rpc.testnet.near.org",
    chainSignerAccountId: getOptionalEnv("ACCESSFI_NEAR_SIGNER_ACCOUNT_ID"),
    chainSignerSecretKey: getOptionalEnv("ACCESSFI_NEAR_SIGNER_SECRET_KEY")
  };
}
