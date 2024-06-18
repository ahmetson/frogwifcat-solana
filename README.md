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