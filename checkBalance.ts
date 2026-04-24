import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  devnet,
  Address,
} from "@solana/kit";
import { loadWalletBytes } from "./store";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

async function checkBalance() {
  const walletBytes = loadWalletBytes();

  if (!walletBytes) {
    console.error(
      "No wallet found. Run `npm run create-wallet` or `tsx create-wallet.ts` first.",
    );
    process.exit(1);
  }

  const signer = await createKeyPairSignerFromBytes(walletBytes, true);
  const address = signer.address as Address;

  try {
    const { value: balance } = await rpc.getBalance(address).send();
    const balanceInSOL = Number(balance) / 1e9;
    console.log(`Balance for address ${address}: ${balanceInSOL} SOL`);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
  }
}

checkBalance().catch((error: Error) => {
  console.error("Error in checkBalance:", error);
  process.exit(1);
});
