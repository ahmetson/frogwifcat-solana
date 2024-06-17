import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    Cluster,
    PublicKey,
} from "@solana/web3.js";

import {
    ExtensionType,
    createInitializeMintInstruction,
    mintTo,
    getMintLen,
    getTransferFeeAmount,
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
} from '@solana/spl-token';

import {
    createInitializeInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

const payer = Keypair.generate();
const mintAuthority = Keypair.generate();
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

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
const decimals = 9;
const feeBasisPoints = 100; // 1%
const maxFee = BigInt(1_000_000 * Math.pow(10, decimals)); // 1,000,000 tokens

// Define the amount to be minted and the amount to be transferred, accounting for decimals
const mintAmount = BigInt(1_000_000 * Math.pow(10, decimals)); // Mint 1,000,000 tokens
const transferAmount = BigInt(1_000 * Math.pow(10, decimals)); // Transfer 1,000 tokens

// calculate the fee for the transfer
const calcFee = (transferAmount * BigInt(feeBasisPoints)) / BigInt(10_000); // expect 10 fee
const fee = calcFee > maxFee ? maxFee : calcFee; // expect 10 fee

function generateExplorerUrl(txId: string) {
    return `https://explorer.solana.com/tx/${txId}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`;
}

async function main() {
    // Step 1 - Airdrop to Payer
    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({signature: airdropSignature, ...(await connection.getLatestBlockhash())});

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

    // Step 3 - Mint tokens to Owner
    const owner = Keypair.generate();
    const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    const mintSig = await mintTo(connection, payer, mint, sourceAccount, payer, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID);

    console.log("Tokens minted: ", generateExplorerUrl(mintSig));

    // Step 5 - Send Tokens from Owner to a new Account
    const destinationOwner = Keypair.generate();
    const destinationAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, destinationOwner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    const transferSig = await transferCheckedWithFee(
        connection, 
        payer,
        sourceAccount,
        mint,
        destinationAccount,
        owner,
        transferAmount,
        decimals,
        fee,
        [] 
    );
    console.log("Tokens transfered: ", generateExplorerUrl(transferSig));

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