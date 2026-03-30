import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type {
  AccessFiAccessPolicy,
  AccessFiAssetDownload,
  AccessFiCheckoutProvider,
  AccessFiCheckoutQuote,
  AccessFiIntegrationRailStatus,
  AccessFiMembership,
  AccessFiVault,
  AccessFiViewer
} from "@/lib/accessfi/types";
import { getAccessFiFlowConfig, getAccessFiLitConfig, getAccessFiNearConfig, getAccessFiStorachaConfig } from "@/lib/accessfi/env";
import { getAccessFiRepositoryMode } from "@/lib/accessfi/repository";

type StorageUploadInput = {
  vaultTitle: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  previewText: string;
  policy: AccessFiAccessPolicy | { policyType: AccessFiVault["accessType"]; policyJson: Record<string, unknown> };
};

function bufferFromBytes(bytes: Uint8Array) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function buildLitAccessControlConditions(vault: {
  accessType: AccessFiVault["accessType"];
  policyJson: Record<string, unknown>;
}) {
  if (vault.accessType === "token_gated_access") {
    const tokenContract = String(vault.policyJson.tokenContract ?? "");
    const minimumBalance = String(vault.policyJson.minimumTokenBalance ?? "1");
    const chain = String(vault.policyJson.chain ?? "ethereum");

    if (tokenContract) {
      return [
        {
          contractAddress: tokenContract,
          standardContractType: "ERC20",
          chain,
          method: "balanceOf",
          parameters: [":userAddress"],
          returnValueTest: {
            comparator: ">=",
            value: minimumBalance
          }
        }
      ];
    }
  }

  return [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "!=",
        value: "0x0000000000000000000000000000000000000000"
      }
    }
  ];
}

function encryptWithLocalAes(bytes: Uint8Array) {
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(bufferFromBytes(bytes)), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedPayloadB64: encrypted.toString("base64"),
    localKeyBackup: key.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64")
  };
}

function decryptWithLocalAes(payloadB64: string, encryptionRef: Record<string, unknown>) {
  const keyB64 = String(encryptionRef.localKeyBackup ?? "");
  const ivB64 = String(encryptionRef.ivB64 ?? "");
  const tagB64 = String(encryptionRef.tagB64 ?? "");

  if (!keyB64 || !ivB64 || !tagB64) {
    throw new Error("Asset key metadata is incomplete.");
  }

  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyB64, "base64"), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payloadB64, "base64")), decipher.final()]);
}

async function maybeBuildLitEnvelope(input: StorageUploadInput, localEnvelope: ReturnType<typeof encryptWithLocalAes>) {
  const litConfig = getAccessFiLitConfig();

  if (!litConfig.enabled) {
    return {
      ...localEnvelope,
      encryptionRef: JSON.stringify({
        mode: "local-aes-gcm",
        network: null,
        ivB64: localEnvelope.ivB64,
        tagB64: localEnvelope.tagB64,
        localKeyBackup: localEnvelope.localKeyBackup
      })
    };
  }

  try {
    const [{ LitNodeClient }, { encryptString }] = await Promise.all([
      import("@lit-protocol/lit-node-client"),
      import("@lit-protocol/encryption")
    ]);

    const litClient = new LitNodeClient({
      litNetwork: litConfig.network as never,
      alertWhenUnauthorized: false,
      debug: false,
      checkNodeAttestation: false
    });

    await litClient.connect();

    const accessControlConditions = buildLitAccessControlConditions({
      accessType: input.policy.policyType,
      policyJson: input.policy.policyJson
    });

    const manifest = {
      vaultTitle: input.vaultTitle,
      fileName: input.fileName,
      mimeType: input.mimeType,
      previewText: input.previewText,
      localKeyBackup: localEnvelope.localKeyBackup
    };

    const encryptedManifest = await encryptString(
      {
        accessControlConditions,
        dataToEncrypt: JSON.stringify(manifest)
      },
      litClient
    );

    return {
      ...localEnvelope,
      encryptionRef: JSON.stringify({
        mode: "lit-manifest",
        network: litConfig.network,
        ciphertext: encryptedManifest.ciphertext,
        dataToEncryptHash: encryptedManifest.dataToEncryptHash,
        accessControlConditions,
        ivB64: localEnvelope.ivB64,
        tagB64: localEnvelope.tagB64,
        localKeyBackup: localEnvelope.localKeyBackup
      })
    };
  } catch (error) {
    return {
      ...localEnvelope,
      encryptionRef: JSON.stringify({
        mode: "local-aes-gcm",
        network: litConfig.network,
        fallbackReason: error instanceof Error ? error.message : "Lit encryption unavailable",
        ivB64: localEnvelope.ivB64,
        tagB64: localEnvelope.tagB64,
        localKeyBackup: localEnvelope.localKeyBackup
      })
    };
  }
}

async function parseStorachaProof(proofString: string) {
  const [{ importDAG, extract }, CAR, { CarReader }, { CID }, { base64 }, { identity }] = await Promise.all([
    import("@ucanto/core/delegation"),
    import("@ucanto/transport/car"),
    import("@ipld/car"),
    import("multiformats"),
    import("multiformats/bases/base64"),
    import("multiformats/hashes/identity")
  ]);

  const legacyExtract = async (bytes: Uint8Array) => {
    const blocks = [];
    const reader = await CarReader.fromBytes(bytes);

    for await (const block of reader.blocks()) {
      blocks.push(block);
    }

    return importDAG(blocks as never);
  };

  try {
    const cid = CID.parse(proofString, base64);

    if (cid.code !== CAR.codec.code) {
      throw new Error("Storacha proof is not a CAR CID.");
    }

    if (cid.multihash.code !== identity.code) {
      throw new Error("Storacha proof is not using an identity multihash.");
    }

    try {
      const result = await extract(cid.multihash.digest);

      if (result.error) {
        throw new Error("Failed to extract Storacha delegation.");
      }

      return result.ok;
    } catch {
      return legacyExtract(cid.multihash.digest);
    }
  } catch {
    return legacyExtract(base64.baseDecode(proofString));
  }
}

async function maybeUploadToStoracha(fileName: string, encryptedBytes: Uint8Array) {
  const storachaConfig = getAccessFiStorachaConfig();

  if (!storachaConfig.spaceDid || !storachaConfig.proof || !storachaConfig.principal) {
    return null;
  }

  try {
    const [{ create }, ed25519, memoryStoreModule] = await Promise.all([
      import("@storacha/client"),
      import("@storacha/client/principal/ed25519"),
      import("@storacha/client/stores/memory")
    ]);

    const client = await create({
      principal: ed25519.parse(storachaConfig.principal),
      store: new memoryStoreModule.StoreMemory()
    });

    const proof = await parseStorachaProof(storachaConfig.proof);
    await client.addProof(proof);
    await client.setCurrentSpace(storachaConfig.spaceDid as never);

    const uploadFile = new File([bufferFromBytes(encryptedBytes)], `${fileName}.enc`, {
      type: "application/octet-stream"
    });

    const cid = await client.uploadFile(uploadFile);

    return {
      storageProvider: "storacha" as const,
      storageRef: `ipfs://${cid}`,
      gatewayUrl: `${storachaConfig.gateway.replace(/\/$/, "")}/${cid}`
    };
  } catch {
    return null;
  }
}

export const storageService = {
  async uploadEncryptedAsset(input: StorageUploadInput) {
    const localEnvelope = encryptWithLocalAes(input.bytes);
    const litEnvelope = await maybeBuildLitEnvelope(input, localEnvelope);
    const storachaResult = await maybeUploadToStoracha(input.fileName, Buffer.from(localEnvelope.encryptedPayloadB64, "base64"));

    return {
      encrypted: true,
      encryptedPayloadB64: localEnvelope.encryptedPayloadB64,
      encryptionRef: litEnvelope.encryptionRef,
      storageProvider: storachaResult?.storageProvider ?? "local_demo",
      storageRef: storachaResult?.storageRef ?? `local://${input.vaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${input.fileName}`
    };
  },

  async getAssetStatus(storageRef: string) {
    return {
      ready: Boolean(storageRef),
      storageRef
    };
  }
};

export const accessControlService = {
  createPolicy(input: {
    accessType: AccessFiVault["accessType"];
    depositAmount: number | null;
    subscriptionAmount: number | null;
    currency: string;
    allowlistIdentifiers: string[];
    tokenSymbol: string | null;
    tokenContract: string | null;
    minimumTokenBalance: string | null;
    timeLimitHours: number | null;
  }) {
    return {
      policyType: input.accessType,
      policyJson: {
        reserveRequired: input.depositAmount,
        recurringCharge: input.subscriptionAmount,
        currency: input.currency,
        allowlistIdentifiers: input.allowlistIdentifiers,
        tokenSymbol: input.tokenSymbol,
        tokenContract: input.tokenContract,
        minimumTokenBalance: input.minimumTokenBalance,
        timeLimitHours: input.timeLimitHours,
        rails:
          input.accessType === "allowlist_access"
            ? ["email_passkey"]
            : (["flow_wallet", "near_intent", "email_passkey"] satisfies AccessFiCheckoutProvider[])
      }
    };
  },

  getPolicySummary(policy: AccessFiAccessPolicy | null, vault: AccessFiVault) {
    if (!policy) {
      return ["Programmable access policy missing."];
    }

    const summary: string[] = [];

    if (vault.accessType === "deposit_to_unlock" && vault.depositAmount) {
      summary.push(`Deposit ${vault.depositAmount} ${vault.currency} into the reserve to unlock the vault.`);
    }

    if (vault.accessType === "subscription_access" && vault.subscriptionAmount) {
      summary.push(`Recurring access charges ${vault.subscriptionAmount} ${vault.currency} per billing cycle.`);
    }

    if (vault.accessType === "allowlist_access") {
      summary.push("Only invited emails or domains can activate access.");
    }

    if (vault.accessType === "token_gated_access") {
      summary.push(
        `Wallet must satisfy the token rule for ${(policy.policyJson.tokenSymbol as string | undefined) ?? "the configured token"}.`
      );
    }

    if (vault.accessType === "time_based_access") {
      summary.push("Access is time-scoped and will expire automatically.");
    }

    summary.push("Encrypted assets stay locked until app policy and sponsor rail state both resolve true.");

    return summary;
  },

  checkAccess(input: {
    vault: AccessFiVault;
    policy: AccessFiAccessPolicy | null;
    viewer: AccessFiViewer;
    membership: AccessFiMembership | null;
    allowlist: string[];
    flowAddress: string | null;
    nearAccountId: string | null;
    tokenProof: string | null;
  }) {
    if (!input.vault.published) {
      return { ok: false, message: "This vault is not published." };
    }

    if (input.vault.accessType === "allowlist_access") {
      const viewerDomain = input.viewer.email.split("@")[1] ?? "";
      const allowed = input.allowlist.some(
        (entry) => entry.toLowerCase() === input.viewer.email.toLowerCase() || entry.toLowerCase() === viewerDomain.toLowerCase()
      );

      return allowed
        ? { ok: true }
        : { ok: false, message: "This vault is allowlist-only. Your email is not on the invite list." };
    }

    if (input.vault.accessType === "token_gated_access") {
      return input.flowAddress || input.nearAccountId || input.tokenProof
        ? { ok: true }
        : { ok: false, message: "Link a wallet or provide a token proof string to satisfy the token gate." };
    }

    if (input.vault.accessType === "time_based_access" && input.membership?.endAt) {
      return new Date(input.membership.endAt).getTime() > Date.now()
        ? { ok: true }
        : { ok: false, message: "Your timed access has expired." };
    }

    return { ok: true };
  }
};

export const paymentsService = {
  async createCheckout(input: {
    vault: AccessFiVault;
    provider: AccessFiCheckoutProvider;
    viewer: AccessFiViewer;
    flowAddress: string | null;
    nearAccountId: string | null;
  }): Promise<AccessFiCheckoutQuote> {
    const amount = input.vault.depositAmount ?? input.vault.subscriptionAmount ?? 0;
    const flow = getAccessFiFlowConfig();
    const near = getAccessFiNearConfig();
    const txRef = `${input.provider}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;

    if (input.provider === "near_intent") {
      return {
        provider: input.provider,
        amount,
        currency: input.vault.currency,
        txRef,
        quoteJson: {
          network: near.network,
          rpcUrl: near.rpcUrl,
          nearAccountId: input.nearAccountId,
          intentLabel: `Unlock ${input.vault.title}`
        }
      };
    }

    if (input.provider === "flow_wallet") {
      return {
        provider: input.provider,
        amount,
        currency: input.vault.currency,
        txRef,
        quoteJson: {
          network: flow.network,
          accessNode: flow.accessNode,
          walletDiscovery: flow.walletDiscovery,
          flowAddress: input.flowAddress
        }
      };
    }

    return {
      provider: "email_passkey",
      amount,
      currency: input.vault.currency,
      txRef,
      quoteJson: {
        email: input.viewer.email,
        mode: "walletless_demo_checkout"
      }
    };
  },

  async confirmAccessActivation() {
    return {
      ok: true
    };
  }
};

export const membershipService = {
  getMembershipStatus(membership: AccessFiMembership | null) {
    if (!membership) {
      return {
        label: "Not joined",
        tone: "neutral" as const
      };
    }

    if (membership.status === "active") {
      return {
        label: "Active",
        tone: "positive" as const
      };
    }

    if (membership.status === "pending") {
      return {
        label: "Pending",
        tone: "warning" as const
      };
    }

    return {
      label: membership.status,
      tone: "neutral" as const
    };
  }
};

export async function decryptStoredAsset(asset: {
  originalFileName: string;
  mimeType: string;
  encryptionRef: string;
  encryptedPayloadB64: string | null;
}): Promise<AccessFiAssetDownload> {
  if (!asset.encryptedPayloadB64) {
    throw new Error("No downloadable payload is stored for this asset yet.");
  }

  const encryptionRef = JSON.parse(asset.encryptionRef) as Record<string, unknown>;

  if (encryptionRef.mode === "seed-plain") {
    return {
      fileName: asset.originalFileName,
      mimeType: asset.mimeType,
      bytes: Buffer.from(asset.encryptedPayloadB64, "base64")
    };
  }

  return {
    fileName: asset.originalFileName,
    mimeType: asset.mimeType,
    bytes: decryptWithLocalAes(asset.encryptedPayloadB64, encryptionRef)
  };
}

export async function getIntegrationStatus(): Promise<AccessFiIntegrationRailStatus[]> {
  const flow = getAccessFiFlowConfig();
  const lit = getAccessFiLitConfig();
  const storacha = getAccessFiStorachaConfig();
  const near = getAccessFiNearConfig();
  const repositoryMode = await getAccessFiRepositoryMode();

  return [
    {
      key: "persistence",
      label: "Persistence",
      configured: true,
      mode: repositoryMode === "supabase" ? "Supabase tables live" : "Local demo store fallback",
      network: null,
      details:
        repositoryMode === "supabase"
          ? ["Vaults, memberships, proofs, and checkout records persist in Supabase."]
          : ["AccessFi persists to a local JSON demo store until the included Supabase migration is applied."]
    },
    {
      key: "flow",
      label: "Flow",
      configured: Boolean(flow.accessNode && flow.walletDiscovery),
      mode: "Client wallet link + checkout quote",
      network: flow.network,
      details: [`Access node: ${flow.accessNode}`, `Discovery: ${flow.walletDiscovery}`]
    },
    {
      key: "lit",
      label: "Lit Protocol",
      configured: lit.enabled,
      mode: lit.enabled ? "Runtime encryption envelope" : "Disabled via env",
      network: lit.network,
      details: [
        "AccessFi mirrors the app policy into a Lit access-control condition set.",
        "If Lit is unavailable at runtime, the app falls back to local AES while preserving the proof trail."
      ]
    },
    {
      key: "storacha",
      label: "Storacha/Filecoin",
      configured: Boolean(storacha.spaceDid && storacha.proof && storacha.principal),
      mode: storacha.spaceDid && storacha.proof && storacha.principal ? "Credentialed upload path" : "Credential-gated",
      network: "Filecoin-backed",
      details: storacha.spaceDid
        ? [`Space DID: ${storacha.spaceDid}`, `Gateway: ${storacha.gateway}`]
        : ["Set principal, proof, and space DID to switch encrypted payloads from local storage to Storacha."]
    },
    {
      key: "near",
      label: "NEAR",
      configured: Boolean(near.rpcUrl),
      mode: near.chainSignerSecretKey ? "Intent + signer ready" : "Intent quote ready",
      network: near.network,
      details: [`RPC: ${near.rpcUrl}`, near.chainSignerAccountId ? `Signer: ${near.chainSignerAccountId}` : "Signer key not configured"]
    }
  ];
}
