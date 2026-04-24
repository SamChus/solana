import {
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  writeKeyPairSigner,
} from "@solana/kit";
import {
  backupLegacyWallet,
  getWalletFilePath,
  loadWalletBytes,
  walletFileExists,
} from "./store";

async function getOrCreateWallet() {
  const walletBytes = loadWalletBytes();
  const walletPath = getWalletFilePath();

  if (walletBytes) {
    const signer = await createKeyPairSignerFromBytes(walletBytes, true);
    console.log("Loaded existing wallet from wallet.json");
    console.log("Address:", signer.address);
    return signer;
  }

  if (walletFileExists()) {
    console.warn(
      "Found legacy wallet.json without a reloadable private key. Backing it up before creating a new wallet.",
    );
    backupLegacyWallet();
  }

  const signer = await generateKeyPairSigner(true);
  await writeKeyPairSigner(signer, walletPath, {
    unsafelyOverwriteExistingKeyPair: true,
  });

  console.log("Generated a new wallet and saved it to wallet.json");
  console.log("Address:", signer.address);
  return signer;
}

async function createWallet(): Promise<void> {
  await getOrCreateWallet();
}

createWallet().catch((error: Error) => {
  console.error("Failed to create wallet:", error);
  process.exit(1);
});
