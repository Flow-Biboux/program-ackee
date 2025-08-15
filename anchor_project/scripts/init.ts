import { Connection, Keypair } from "@solana/web3.js";
import { getProgram } from "../src/helper/getProgram";
import { initializeTx } from "../src/functions/initializeTx";

import adminKp from "../../../../.config/solana/ackeeTest.json";

export async function initialize(connection: Connection) {
  // Initialization logic here
  const admin = Keypair.fromSecretKey(Buffer.from(adminKp));
  const tx = await initializeTx({ admin: admin.publicKey, feeBasis: 1000, connection });
  const signature = await connection.sendTransaction(tx, [admin]);
  await connection.confirmTransaction(signature);

  console.log("Initialization complete.");
}

initialize(new Connection("https://api.devnet.solana.com"));