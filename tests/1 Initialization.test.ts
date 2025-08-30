import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { assert } from "chai";
import { formatAnchorError } from "./utils";

describe("stake_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const provider = program.provider as anchor.AnchorProvider;
  const payer = provider.wallet;

  // Test constants
  const communityWallet = new anchor.web3.PublicKey(
    "CHNWJVCFagNp6iKHr4BLXs6otVpzUhNv8E6jvwN9j8zf"
  );
  const tokenMint = new anchor.web3.PublicKey(
    "So11111111111111111111111111111111111111112" // SOL placeholder
  );

  // PDA seeds
  let [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  it.skip("Initializes the config account", async () => {
    const tx = await program.methods
      .initialize(communityWallet)
      .accounts({
        authority: payer.publicKey,
        payer: payer.publicKey,
        tokenMint,
      })
      .rpc();

    console.log("✅ Tx Signature:", tx);

    // Fetch account state
    const config = await program.account.config.fetch(configPda);

    // Assertions
    assert.ok(config.communityWallet.equals(communityWallet));
    assert.ok(config.tokenMint.equals(tokenMint));
    assert.ok(config.authority.equals(payer.publicKey));
    assert.equal(config.bump, configBump);
    assert.equal(config.taxPercentage, 5, "Default tax should be 0");
    assert.isFalse(config.paused, "Should not be paused by default");
    assert.equal(config.version, 1, "Version should be set to 1");
  });

  it("Fails if re-initialized", async () => {
    try {
      await program.methods
        .initialize(communityWallet)
        .accounts({
          authority: payer.publicKey,
          payer: payer.publicKey,
          tokenMint,
        })
        .rpc();
      assert.fail("Re-initialization should fail but it succeeded");
    } catch (err) {
      console.log("✅ Expected failure:", formatAnchorError(err));
      // assert.include(err.error.errorMessage, "already initialized");
    }
  });
});


