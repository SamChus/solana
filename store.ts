import fs from "fs";
import path from "path";

const WALLET_FILE = path.join(process.cwd(), "wallet.json");

interface StoredWallet {
  address: string;
  publicKey: string;
  createdAt: string;
}

export async function saveWallet(
  address: string,
  publicKey: string,
): Promise<void> {
  const wallet: StoredWallet = {
    address,
    publicKey,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2));
  console.log(`Wallet saved to ${WALLET_FILE}`);
}

export function loadWallet(): StoredWallet | null {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      const data = fs.readFileSync(WALLET_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load wallet:", error);
  }
  return null;
}

export function deleteWallet(): void {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      fs.unlinkSync(WALLET_FILE);
      console.log("Wallet deleted");
    }
  } catch (error) {
    console.error("Failed to delete wallet:", error);
  }
}
