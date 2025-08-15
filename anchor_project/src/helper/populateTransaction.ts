import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export async function populateTransaction(
  tx: Transaction, 
  connection: Connection, 
  feePayer: PublicKey | string
): Promise<Transaction> {
  console.log('connection', connection)
  console.log('connection.getLatestBlockhash', connection.getLatestBlockhash)
  tx.feePayer = new PublicKey(feePayer);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}
