import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "../helper/getProgram";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { getGlobalStatePda, getFeePda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function initializeTx({ admin, feeBasis, connection }: { admin: PublicKey; feeBasis: number; connection: Connection }) {
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);
  const feeVault = getFeePda(connection, program);

  const tx = await program.methods
    .initialize(feeBasis)
    .accountsStrict({
      globalState,
      feeVault,
      admin,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .transaction();

  return populateTransaction(tx, connection, admin);
}


