// This script allows you to use Solana CLI generated accounts in the wallets.
// It prints a private key that you can import into the Solana Wallets
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import fs from 'fs';
import 'dotenv/config';
import { Keypair } from '@solana/web3.js';

const PAYER_KEY_BYTES = fs.readFileSync(process.env.PAYER_PATH!);
const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(PAYER_KEY_BYTES.toString())));

const secretKey = bs58.encode(payer.secretKey);

console.log(`PubKey (base58): ${payer.publicKey.toBase58()}`);
console.log(`SecretKey (base58): ${secretKey}`);