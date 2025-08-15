import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "./getProgram";
import { FEE_VAULT_SEED, GLOBAL_STATE_SEED, STAKER_SEED } from "../constant";
import { Program } from "@coral-xyz/anchor";
import { TransactionStaking } from "../types";

export function getGlobalStatePda(connection?: Connection, program?: Program<TransactionStaking>): PublicKey {
  if (!program) program = getProgram(connection);
  const [globalState] = PublicKey.findProgramAddressSync([Buffer.from(GLOBAL_STATE_SEED)], program.programId);
  return globalState;
}

export function getStakerPda(user: PublicKey|string, connection?: Connection, program?: Program<TransactionStaking>): PublicKey {
  if (!program) program = getProgram(connection);
//   console.log(user);
  const [staker] = PublicKey.findProgramAddressSync([Buffer.from(STAKER_SEED), new PublicKey(user).toBuffer()], program.programId);
  return staker;
}

export function getFeePda(connection?: Connection, program?: Program<TransactionStaking>): PublicKey {
  if (!program) program = getProgram(connection);
  const [fee] = PublicKey.findProgramAddressSync([Buffer.from(FEE_VAULT_SEED)], program.programId);
  return fee;
}
