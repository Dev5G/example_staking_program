import * as anchor from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import { toDecimals } from "./utils";

describe.skip("Token Initialization and Minting", () => {
    // Mint 7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX
  // Use Anchor provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  let mint: anchor.web3.PublicKey;
  let userAta: anchor.web3.PublicKey;

  it("Initialize token mint and mint tokens", async () => {
    // Step 1: Create new token mint with 6 decimals
    mint = await createMint(
      connection,
      payer.payer, // payer Keypair
      payer.publicKey, // mint authority
      payer.publicKey, // freeze authority
      6 // decimals
    );

    console.log("Created mint:", mint.toBase58());

    // Step 2: Get/create ATA for payer
    const ataAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mint,
      payer.publicKey
    );

    userAta = ataAccount.address;
    console.log("User ATA:", userAta.toBase58());

    // Step 3: Mint 100,000,000 tokens (consider decimals)
    // Amount must be in smallest units: 100,000,000 * 10^6
    const amount = toDecimals(100_000_000, 6)

    await mintTo(
      connection,
      payer.payer,
      mint,
      userAta,
      payer.payer, // mint authority
      amount
    );

    console.log("Minted tokens:", amount.toString());

    // Step 4: Fetch balance and assert
    const accountInfo = await getAccount(connection, userAta);
    assert.equal(accountInfo.amount.toString(), amount.toString());

    console.log("Balance verified:", accountInfo.amount.toString());
  });
});
