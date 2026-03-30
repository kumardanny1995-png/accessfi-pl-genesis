import { NextResponse } from "next/server";

import { getAccessFiViewer } from "@/lib/accessfi/auth";
import { getAssetById, listCreatorVaultBundles, listMemberVaultBundles } from "@/lib/accessfi/repository";
import { decryptStoredAsset } from "@/lib/accessfi/services";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      assetId: string;
    }>;
  }
) {
  const [{ assetId }, viewer] = await Promise.all([context.params, getAccessFiViewer()]);

  if (!viewer) {
    return new NextResponse("Sign in to download premium assets.", { status: 401 });
  }

  const asset = await getAssetById(assetId);

  if (!asset) {
    return new NextResponse("Asset not found.", { status: 404 });
  }

  const [memberBundles, creatorBundles] = await Promise.all([
    listMemberVaultBundles(viewer.id),
    listCreatorVaultBundles(viewer.id)
  ]);

  const allowedVaultIds = new Set([...memberBundles, ...creatorBundles].map((bundle) => bundle.vault.id));

  if (!allowedVaultIds.has(asset.vaultId)) {
    return new NextResponse("You do not have access to this asset.", { status: 403 });
  }

  const download = await decryptStoredAsset(asset);

  return new NextResponse(download.bytes, {
    status: 200,
    headers: {
      "Content-Type": download.mimeType,
      "Content-Disposition": `attachment; filename="${download.fileName}"`
    }
  });
}
