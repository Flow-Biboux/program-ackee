import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "../helper/getProgram";
import { getGlobalStatePda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function updateFeeBasisPointsTx({
  admin,
  feeBasisPoints,
  connection,
}: {
  admin: PublicKey;
  feeBasisPoints: number;
  connection: Connection;
}) {
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);

  const tx = await program.methods
    .updateFeeBasisPoints(feeBasisPoints)
    .accountsStrict({
      globalState,
      admin,
    })
    .transaction();

  return populateTransaction(tx, connection, admin);
}


