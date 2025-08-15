import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../../target/idl/transaction_staking.json";
import { TransactionStaking } from "../types";
import { Connection, Keypair } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export function getProgram(connection?: Connection): Program<TransactionStaking> {
    console.log('idl', idl.address)
  return new Program(
    idl as TransactionStaking,
    new AnchorProvider(connection ?? new Connection("https://api.devnet.solana.com"), new NodeWallet(Keypair.generate()))
  );
}
