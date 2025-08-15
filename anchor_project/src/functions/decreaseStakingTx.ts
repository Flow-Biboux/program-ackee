import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../helper/getProgram";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { getGlobalStatePda, getStakerPda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function decreaseStakingTx({
  user,
  amount,
  connection,
}: {
  user: PublicKey|string;
  amount: number;
  connection: Connection;
}) {
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);
  const staker = getStakerPda(user, connection, program);

  const tx = await program.methods
    .decreaseStaking(new BN(amount))
    .accountsStrict({
      globalState,
      staker,
      user,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .transaction();

  return populateTransaction(tx, connection, user);
}


