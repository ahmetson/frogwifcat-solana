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

---

Airdrop some SOLs

`solana airdrop 2`

> It works for devnet and localhost only.