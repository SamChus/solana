import fs from "fs";
import path from "path";

const WALLET_FILE = path.join(process.cwd(), "wallet.json"); 

export function getWalletFilePath(): string {
  return WALLET_FILE;
}

export function loadWalletBytes(): Uint8Array | null {
  try {
    if (!fs.existsSync(WALLET_FILE)) {
      return null;
    }

    const data = fs.readFileSync(WALLET_FILE, "utf-8").trim();
    const parsed = JSON.parse(data);
    console.log(data)

    if (Array.isArray(parsed)) {
      return new Uint8Array(parsed);
    }

    if (
      parsed &&
      typeof parsed === "object" && 
      typeof parsed.secretKey === "string"
    ) {
      return new Uint8Array(Buffer.from(parsed.secretKey, "base64"));
    }

    return null;
  } catch (error) {
    console.error("Failed to load wallet:", error);
    return null;
  }
}

export function walletFileExists(): boolean {
  return fs.existsSync(WALLET_FILE);
}

export function backupLegacyWallet(): void {
  if (!fs.existsSync(WALLET_FILE)) {
    return;
  }

  let backupPath = `${WALLET_FILE}.legacy.json`;
  let suffix = 1;

  while (fs.existsSync(backupPath)) {
    backupPath = `${WALLET_FILE}.legacy.${suffix}.json`;
    suffix += 1;
  }

  fs.renameSync(WALLET_FILE, backupPath);
  console.log(`Backed up legacy wallet file to ${backupPath}`);
}
