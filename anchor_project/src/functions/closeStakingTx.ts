import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "../helper/getProgram";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { getGlobalStatePda, getFeePda, getStakerPda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function closeStakingTx({ user, connection }: { user: PublicKey | string; connection: Connection }) {
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);
  const feeVault = getFeePda(connection, program);
  const staker = getStakerPda(user, connection, program);

  const tx = await program.methods
    .closeStaking()
    .accountsStrict({
      globalState,
      feeVault,
      staker,
      user,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .transaction();

  return populateTransaction(tx, connection, user);
}
