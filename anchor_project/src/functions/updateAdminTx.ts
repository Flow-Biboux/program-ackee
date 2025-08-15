import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "../helper/getProgram";
import { getGlobalStatePda } from "../helper/getPda";
import { populateTransaction } from "../helper/populateTransaction";

export async function updateAdminTx({ admin, newAdmin, connection }: { admin: PublicKey; newAdmin: PublicKey; connection: Connection }) {
  const program = getProgram(connection);

  const globalState = getGlobalStatePda(connection, program);

  const tx = await program.methods
    .updateAdmin(newAdmin)
    .accountsStrict({
      globalState,
      admin,
    })
    .transaction();

  return populateTransaction(tx, connection, admin);
}


