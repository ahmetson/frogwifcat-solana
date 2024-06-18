// This script allows you to use Solana CLI generated accounts in the wallets.
// It prints a private key that you can import into the Solana Wallets
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import SECRET_KEY_BYTES from '../../../priv/solana/id.json';            // <<---- CHANGE WITH YOUR ID PATH!
import { Keypair } from '@solana/web3.js';

const keyPair = Keypair.fromSecretKey(new Uint8Array(SECRET_KEY_BYTES));
const secretKey = bs58.encode(keyPair.secretKey);

console.log(`PubKey (base58): ${keyPair.publicKey.toBase58()}`);
console.log(`SecretKey (base58): ${secretKey}`);