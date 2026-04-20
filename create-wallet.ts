import { generateKeyPairSigner } from "@solana/kit";
import { saveWallet } from "./store";

async function createWallet(): Promise<void> {
  const keypair = await generateKeyPairSigner();
  const address = keypair.address;
 

  console.log("=== Solana Wallet Keys ===\n");
  console.log("Public Address:", keypair.address);

  // Try to export the public key since it's extractable
  try {
    const publicKeyExported = await crypto.subtle.exportKey(
      "raw",
      keypair.keyPair.publicKey,
    );
    const publicKeyHex = Buffer.from(publicKeyExported).toString("hex");
    const publicKeyBase64 = Buffer.from(publicKeyExported).toString("base64");

    saveWallet(address, publicKeyBase64);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Could not export public key:", errorMessage);
  }

  // Note: Private key is not extractable (extractable: false)
  // This is a security feature - the private key cannot be exported
  console.log("\nNote: Private key is non-extractable for security reasons.");
  console.log("The keypair can be used to sign transactions directly via:");
  console.log("- keypair.signMessages()");
  console.log("- keypair.signTransactions()");
}

createWallet().catch((error: Error) => {
  console.error("Failed to create wallet:", error);
  process.exit(1);
});
