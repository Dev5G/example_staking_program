import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { assert } from "chai";
import { formatAnchorError } from "./utils";

describe.skip("Initialization tests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const provider = program.provider as anchor.AnchorProvider;
  const payer = provider.wallet;

  // Test constants
  const communityWallet = new anchor.web3.PublicKey(
    "CHNWJVCFagNp6iKHr4BLXs6otVpzUhNv8E6jvwN9j8zf"
  );
  const tokenMint = new anchor.web3.PublicKey(
    "7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX" // placeholder SOL mint
  );

  // Derive PDAs
  const [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [poolPda, poolBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    program.programId
  );

  const poolVault = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: poolPda,
  });

  const rewardVault = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: configPda,
  });

  it("Initializes config, pool, and vaults", async () => {
    const tx = await program.methods
      .initialize(communityWallet)
      .accounts({
        authority: payer.publicKey,
        payer: payer.publicKey,
        tokenMint,
      })
      .rpc();

    console.log("✅ Tx Signature:", tx);

    // --- Check config ---
    const config = await program.account.config.fetch(configPda);
    assert.ok(config.communityWallet.equals(communityWallet));
    assert.ok(config.tokenMint.equals(tokenMint));
    assert.ok(config.authority.equals(payer.publicKey));
    assert.equal(config.bump, configBump);
    assert.equal(config.taxPercentage, 5, "Default tax should be 5%");
    assert.isFalse(config.paused, "Should not be paused by default");
    assert.equal(config.version, 1, "Version should be set to 1");

    // --- Check pool ---
    const pool = await program.account.stakingPool.fetch(poolPda);
    assert.equal(pool.totalStaked.toNumber(), 0);
    assert.equal(pool.totalTaxCollected.toNumber(), 0);
    assert.equal(pool.totalRewardsDistributed.toNumber(), 0);
    assert.equal(pool.bump, poolBump);

    // --- Vaults should exist ---
    const poolVaultAcc = await provider.connection.getAccountInfo(poolVault);
    const rewardVaultAcc = await provider.connection.getAccountInfo(rewardVault);

    assert.ok(poolVaultAcc, "Pool vault ATA should exist");
    assert.ok(rewardVaultAcc, "Reward vault ATA should exist");
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
      // Optionally assert for Anchor's "already in use" error
    }
  });
});
