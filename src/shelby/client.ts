import { ShelbyClient, ShelbyBlobClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
import type { MoveRecord, GameResult } from "../game/types";
import {
  createDefaultErasureCodingProvider,
  generateCommitments,
  expectedTotalChunksets,
  type BlobCommitments,
} from "@shelby-protocol/sdk/browser";

export const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: import.meta.env.VITE_SHELBY_API_KEY,
});

export async function encodeJsonBlob(payload: unknown): Promise<BlobCommitments & { data: Uint8Array }> {
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(provider, data);

  return { ...commitments, data };
}

export async function buildRegisterMovePayload(args: {
  accountAddress: string;
  gameId: string;
  move: MoveRecord;
}): Promise<{
  payload: ReturnType<typeof ShelbyBlobClient.createRegisterBlobPayload>;
  blobName: string;
  data: Uint8Array;
}> {
  const blobName = `${args.gameId}-move-${args.move.turnNumber}.json`;

  const hotStorageRecord = {
    type: "shelbywars_move",
    storage: "hot" as const,
    protocol: "ShelbyWars",
    gameId: args.gameId,
    move: args.move,
  };

  const commitments = await encodeJsonBlob(hotStorageRecord);

  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    account: args.accountAddress,
    blobName,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: expectedTotalChunksets(commitments.raw_data_size),
    expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000,
    blobSize: commitments.raw_data_size,
  });

  return { payload, blobName, data: commitments.data };
}

export async function buildRegisterResultPayload(args: {
  accountAddress: string;
  result: GameResult;
}): Promise<{
  payload: ReturnType<typeof ShelbyBlobClient.createRegisterBlobPayload>;
  blobName: string;
  data: Uint8Array;
}> {
  const blobName = `${args.result.gameId}-result.json`;

  const hotStorageRecord = {
    type: "shelbywars_result",
    storage: "hot" as const,
    protocol: "ShelbyWars",
    result: args.result,
  };

  const commitments = await encodeJsonBlob(hotStorageRecord);

  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    account: args.accountAddress,
    blobName,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: expectedTotalChunksets(commitments.raw_data_size),
    expirationMicros: (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000,
    blobSize: commitments.raw_data_size,
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

