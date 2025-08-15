import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "../helper/getProgram";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { getGlobalStatePda, getFeePda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function transferTx({
  from,
  to,
  amount,
  connection,
}: {
  from: PublicKey;
  to: PublicKey;
  amount: number;
  connection: Connection;
}) {  
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);
  const feeVault = getFeePda(connection, program);

  const tx = await program.methods
    .transfer(new BN(amount))
    .accountsStrict({
      from,
      to,
      feeVault,
      globalState,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .transaction();

  return populateTransaction(tx, connection, from);
}


