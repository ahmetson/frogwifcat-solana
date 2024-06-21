import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
    PublicKey,
    Cluster,
} from "@solana/web3.js";

import fs from 'fs';
import 'dotenv/config';

import {
    ExtensionType,
    createInitializeMintInstruction,
    mintTo,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    createInitializeTransferFeeConfigInstruction,
    transferCheckedWithFee,
    createAssociatedTokenAccountIdempotent,
    createInitializeMetadataPointerInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    getMint,
    getMetadataPointerState,
    getTokenMetadata,
    createSetAuthorityInstruction,
    AuthorityType,
} from '@solana/spl-token';

import {
    createInitializeInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";

import { OftTools, OftProgram as oft, OFT_SEED } from "@layerzerolabs/lz-solana-sdk-v2";
// import oftJson from "@layerzerolabs/lz-solana-sdk-v2/deployments/solana-testnet/oft.json";
//console.log(oftJson.address); // print it as PublicKey

// LayerZero testnet is on Solana Testnet, not in devnet
const cluster: string = "mainnet-beta"; // testnet | localhost
// const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
const connection = new Connection(clusterApiUrl(cluster as Cluster), "confirmed");

const PAYER_KEY_BYTES = fs.readFileSync(process.env.PAYER_PATH!);
const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(PAYER_KEY_BYTES.toString())));
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

const mintPath = `${process.env.KEYS_PATH}${mint.toBase58()}.json`;

fs.writeFileSync(mintPath, '['+mintKeypair.secretKey.toString()+']');
console.log(`Check out the ${mintPath}, for the saved mint account`);

// Metadata to store in Mint Account
const metaData: TokenMetadata = {
    updateAuthority: mint,
    mint: mint,
    name: "frogwifcat",
    symbol: "WEF",
    uri: "https://raw.githubusercontent.com/ahmetson/frogwifcat/main/assets/metadata.json",
    additionalMetadata: []
  };

// Define the extensions to be used by the mint
const extensions = [
    ExtensionType.TransferFeeConfig,
    ExtensionType.MetadataPointer,
];

// Calculate the length of the mint
const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
const metadataLen = pack(metaData).length;

const mintLen = getMintLen(extensions);

// Set the decimals, fee basis points, and maximum fee
// Layerzero recommends 6 decimals
const decimals = 6;     
const feeBasisPoints = 100; // 1%
const maxFee = BigInt(1_000_000 * Math.pow(10, decimals)); // 1,000,000 tokens


function generateExplorerUrl(txId: string) {
    let base = `https://explorer.solana.com/tx/${txId}`;
    if (cluster === "mainnet-beta") {
        return base;
    }
    if (cluster === "localhost") {
        return base + "?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899"
    }
    return base + "?cluster=" + cluster;
}

async function main() {
    // Step 1 - Airdrop to Payer
    if (cluster === 'localhost') {
        console.log(`Airdrop some solana in the locahost!`);
        const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction({signature: airdropSignature, ...(await connection.getLatestBlockhash())});
    }

    // Step 2 - Create a new token
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataExtension + metadataLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(mint, 
            null, //transferFeeConfigAuthority.publicKey,       // No one can change the transfer fee
            null, //withdrawWithheldAuthority.publicKey,        // No one can withdraw the transfer fee
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMetadataPointerInstruction(
            mint,
            payer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(mint, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mint,
            metadata: mint,
            name: metaData.name,
            symbol: metaData.symbol,
            uri: metaData.uri,
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        }),
    );

    const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], undefined);
    console.log("New token created: ", generateExplorerUrl(newTokenTx));

    // Step 3: Transfer Mint Authority and initialize OFT config
    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), mintKeypair.publicKey.toBuffer()],
        oft.OFT_DEFAULT_PROGRAM_ID, // Default program id is on devnet
    );

    console.log(`OFT Config`, oftConfig);

    console.log(`Transfer authority to the OFT...`);

    const oftTx = new Transaction().add(
        createSetAuthorityInstruction(
            mintKeypair.publicKey, // Minter's public key
            payer.publicKey, // current mint authority
            AuthorityType.MintTokens,
            oftConfig,
            [], // Multisig owners (none in this case)
            TOKEN_2022_PROGRAM_ID,
        ),
        await OftTools.createInitNativeOftIx(
            payer.publicKey, // payer
            payer.publicKey, // admin
            mintKeypair.publicKey, // mint account
            payer.publicKey, // OFT Mint authority
            decimals,
            TOKEN_2022_PROGRAM_ID,
        )
    )

    console.log(`Send transaction...`);

    // send transaction to initialize the OFT
    const oftSig = await sendAndConfirmTransaction(connection, oftTx, [payer]);
    const link = generateExplorerUrl(oftSig);
    console.log(`✅ OFT Initialization Complete! View the transaction here: ${link}`);

    // Step 4 Remove mint authority
    const noMintTx = new Transaction().add(
        await OftTools.createSetMintAuthorityIx(
            payer.publicKey,
            oftConfig,
            null, // the oft program enforces that once the OFT mint authority is set to null, it can not be reset
        )
    )
    const noMintSig = await sendAndConfirmTransaction(connection, noMintTx, [payer]);
    const noMintLink = generateExplorerUrl(noMintSig);
    console.log(`✅ OFT Mint authority removed! View the transaction here: ${noMintLink}`);

    // Step 5 - Read metadata
    // Retrieve mint information
    const mintInfo = await getMint(
        connection,
        mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
    );
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

    // Retrieve and log the metadata state
    const metadata = await getTokenMetadata(
        connection,
        mint, // Mint Account address
    );
    console.log("\nMetadata:", JSON.stringify(metadata, null, 2));
}

console.log(`Starting the app.ts...`);

// Execute the main function
main();