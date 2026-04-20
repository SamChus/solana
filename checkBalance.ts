import {generateKeyPairSigner, createSolanaRpc, devnet, Address} from "@solana/kit"


const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

const address = "5azGoHqpkqX2Ze6PCFRKZDAx58DNaeJNMt37e5CGVker" as Address;

async function checkBalance() {
  try {
    const {value :balance
    } = await rpc.getBalance(address).send();
    const balanceInSOL = Number(balance) / 1e9; // Convert lamports to SOL
    console.log(`Balance for address ${address}: ${balanceInSOL} SOL`);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
  }
}

checkBalance().catch((error: Error) => {
  console.error("Error in checkBalance:", error);
  process.exit(1);
});
