## Network
Set the network [Choose a Cluster](https://docs.solanalabs.com/cli/examples/choose-a-cluster):

`solana config set --url https://api.devnet.solana.com`

`solana config set --url localhost`

---
To test without Layerzero locally use solana-test-validator.

`solana-test-validator -r`

## Account

First, let's create a wallet to pay for transactions using the following instructions: [Guide: Get Started](https://solana.com/developers/guides/getstarted/setup-local-development#6-create-a-file-system-wallet).

`solana-keygen new --outfile ~/.config/solana/<wallet_id>.json`

> Without `--outfile` solana will generate a key pair in `~/.config/solana/id.json`.

Set this wallet as your default by Solana:

`solana config -k ~/.config/solana/<wallet_id>.json`

Print your address:

`solana address`

To import your wallet into the browser or descktop wallets simply print it:

`npx ts-node app/secret_key.ts`

> First, edit the correct path to the keypair location.

---

Airdrop some SOLs

`solana airdrop 2`

> It works for devnet and localhost only.

## Deploy the contracts

`npx ts-node app/app.ts`

This script will write the secret key of the token owner. Mark that for yourself.
For example give it a custom name.

The below are the some important parts of the logs.

---

New token created:  https://explorer.solana.com/tx/2RjYb4dng4AUcyerKJwW3AumuETHT2LoW4UADPN2Aj41oDji2SHfbKoruyAMRsoAkuK1TAMt9e9Ufok1hrVQmdDr?cluster=testnet

OftConfig:

```shell
[PublicKey(FPzEAKnEcBs56TifTQH2hvyyAUUDjRiX7UFmiJ1sz4f)] {
  _bn: <BN: 3b01f5823a06030a2bc9d6c9ffc69996490dd515359be24bbb94dc4a2b80b88>
}
```

✅ OFT Initialization Complete! View the transaction here: https://explorer.solana.com/tx/4tSgsirjgiJ4x4DWrxfrpu2XxFP7bdUVGub3d2s5Gfms4Q859mNu5QdcMMePsfoyBCsNqprfeTpcqVVGxvbrmeub?cluster=testnet

✅ OFT Mint authority removed! View the transaction here: https://explorer.solana.com/tx/2XmB99QyHSNekhjbbm21MdGFxVPCinYHX7HDwDRdsGqAnNsRag7u21cqFAhAwMiDTLxw1KtKYBAFpYCKL6TWqZ6R?cluster=testnet

Metadata Pointer: {
  "authority": "HybZFzdU6MvCCk3sHML4rM2mLkGDHwJzoPqMFZzZ1CTF",
  "metadataAddress": "BLKJh8iyLnPBAw11M1BrwoeKkvN6aDBcbf1MmEEfgL3z"
}

Metadata: {
  "updateAuthority": "HybZFzdU6MvCCk3sHML4rM2mLkGDHwJzoPqMFZzZ1CTF",
  "mint": "BLKJh8iyLnPBAw11M1BrwoeKkvN6aDBcbf1MmEEfgL3z",
  "name": "frogwifcat",
  "symbol": "WEF",
  "uri": "https://raw.githubusercontent.com/ahmetson/frogwifcat/main/assets/metadata.json",
  "additionalMetadata": []
}

---
Set the peers

`npx ts-node app/set_peer.ts`

Output in the terminal:

```shell
Starting the set_peer.ts...
✅ You set 0x00000000000000000000000032ce985bcab4961394a9167d15f5d509d6f23f06 for dstEid 40161! View the transaction here: https://explorer.solana.com/tx/dSXGNqUUBeDQyHiVbV11weBn8y81CjjuWrSfNhGQrXrCV6qEoYr9K7pKqCkUYQtXFaRXzRmD2Me3T6FzkoPTE8i?cluster=testnet
✅ You set 0x000000000000000000000000e40c7856b6d0e1b01decbf9976bb706b9cd1229f for dstEid 40287! View the transaction here: https://explorer.solana.com/tx/2QnNUBD4ndU1WkVXSoV6gWcdd3MkjdzMPiYaSayQJ3WVt62h4TrXYuc8LH5frX3jRjSY5yYL9iN6mNs9kT3H8xgX?cluster=testnet
✅ You set 0x000000000000000000000000e40c7856b6d0e1b01decbf9976bb706b9cd1229f for dstEid 40245! View the transaction here: https://explorer.solana.com/tx/ncoaWm4VeswnZhooWSJY4t6XGgat6JZuNHQX7ndwvRJA8aSfkvVbiAaM3XTQbVppg65P8exjQQdKYjktAwnuwgf?cluster=testnet
```

### For setting peers on EVM based blockchains
Get the Endpoint ID of Solana. For example it's 40168 for Solana testnet.
Use the OFT Config's public key as the peer. And then set `setPeer` in all smartcontracts on EVM based blockchains.

> OFT Config is retreived from the set_peer.ts and app.ts scripts.

### For Sending message on the bridge from EVM to Solana

> https://docs.layerzero.network/v2/developers/solana/oft/native#setting-enforced-options-inbound-to-solana
> 0.0015 SOL must be set as inbound price when sending from EVM to Solana.
> Use the link above when configuring the bridge.
