import { ShelbyClient, ShelbyBlobClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
import type { GameLog } from "../game/types";
import {
  createDefaultErasureCodingProvider,
  generateCommitments,
  expectedTotalChunksets,
  type BlobCommitments,
} from "@shelby-protocol/sdk/browser";

export const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: import.meta.env.VITE_SHELBY_API_KEY,
  rpcEndpoint: "https://api.testnet.shelby.xyz/shelby",
});

export async function encodeJsonBlob(payload: unknown): Promise<BlobCommitments & { data: Uint8Array }> {
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(provider, data);

  return { ...commitments, data };
}

export async function buildRegisterGameLogPayload(args: {
  accountAddress: string;
  gameId: string;
  log: GameLog;
}): Promise<{
  payload: ReturnType<typeof ShelbyBlobClient.createRegisterBlobPayload>;
  blobName: string;
  data: Uint8Array;
}> {
  const blobName = `${args.gameId}-gamelog.json`;

  const commitments = await encodeJsonBlob(args.log);

  const rawSize = Number(commitments.raw_data_size);
  const totalChunksets = Number(expectedTotalChunksets(commitments.raw_data_size));
  const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;

  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    account: args.accountAddress,
    blobName,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: totalChunksets,
    expirationMicros,
    blobSize: rawSize,
    encoding: 0,
  });

  return { payload, blobName, data: commitments.data };
}

export async function uploadBlob(args: {
  accountAddress: string;
  blobName: string;
  data: Uint8Array;
}) {
  await shelbyClient.rpc.putBlob({
    account: args.accountAddress,
    blobName: args.blobName,
    blobData: args.data,
  });
}
