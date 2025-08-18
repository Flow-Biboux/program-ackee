import { getGlobalStatePda } from "./getPda";
import { getProgram } from "./getProgram";

export async function isAdmin(publicKey: string): Promise<boolean> {
  let program = getProgram();
  let globalState = getGlobalStatePda();
  let globalStateData = await program.account.globalState.fetch(globalState);
  return publicKey === globalStateData.admin.toBase58();
}
