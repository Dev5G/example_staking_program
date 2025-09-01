import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { assert } from "chai";
import {
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { toDecimals } from "./utils";

describe.skip("Unstake tests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const provider = program.provider as anchor.AnchorProvider;
  const payer = provider.wallet;
  const decimals = 6;
    const communityWallet = new anchor.web3.PublicKey(
        "CHNWJVCFagNp6iKHr4BLXs6otVpzUhNv8E6jvwN9j8zf"
      );
      const tokenMint = new anchor.web3.PublicKey(
        "7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX" // placeholder SOL mint
      );
  let configPda: anchor.web3.PublicKey;
  let poolPda: anchor.web3.PublicKey;
  let userStatePda: anchor.web3.PublicKey;
  let stakerAta: anchor.web3.PublicKey;
  let poolVault: anchor.web3.PublicKey;
  let communityAta: anchor.web3.PublicKey;

  const stakeAmount = new anchor.BN(toDecimals(20, decimals));

  before(async () => {
    [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );
    [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state"), payer.publicKey.toBuffer(), configPda.toBuffer()],
      program.programId
    );

    stakerAta = getAssociatedTokenAddressSync(
      tokenMint,
      payer.publicKey
    );
    poolVault = getAssociatedTokenAddressSync(
      tokenMint,
      poolPda,
      true
    );

    // Create dummy community wallet + ATA
    communityAta = getAssociatedTokenAddressSync(
      tokenMint,
      communityWallet
    );
  });

  it("Unstakes successfully after stake", async () => {
    // await program.methods
    //   .stake(stakeAmount)
    //   .accounts({
    //     user: payer.publicKey,
    //   })
    //   .rpc();

    const beforeUser = await getAccount(provider.connection, stakerAta);
    const beforePool = await getAccount(provider.connection, poolVault);

    await program.methods
      .unstake()
      .accounts({
        user: payer.publicKey,
        communityWallet: communityWallet,
      })
      .rpc();

    const afterUser = await getAccount(provider.connection, stakerAta);
    const afterPool = await getAccount(provider.connection, poolVault);

    console.log("User balance before:", beforeUser.amount.toString());
    console.log("User balance after:", afterUser.amount.toString());

    assert.isTrue(afterUser.amount > beforeUser.amount, "User should receive tokens back");
    assert.isTrue(afterPool.amount < beforePool.amount, "Pool should decrease after unstake");

    const userState = await program.account.userState.fetch(userStatePda);
    assert.equal(userState.amount.toNumber(), 0, "User state should reset after unstake");
  });

  it("Fails if nothing to unstake", async () => {
    try {
      await program.methods
        .unstake()
        .accounts({
          user: payer.publicKey,
          communityWallet: communityWallet,
        })
        .rpc();
      assert.fail("Should fail when user has no stake");
    } catch (err) {
      console.log("✅ Expected error:", err.error.errorMessage);
    }
  });
  it("Prints summary of stakes and pool", async () => {
    const stakerAcc = await getAccount(provider.connection, stakerAta);
    const poolAcc = await getAccount(provider.connection, poolVault);
    const userState = await program.account.userState.fetch(userStatePda);
    const pool = await program.account.stakingPool.fetch(poolPda);

    console.log("\n--- 📊 Stake Summary ---");
    console.log("Staker ATA Balance:", Number(stakerAcc.amount) / 10 ** decimals);
    console.log("Pool Vault Balance:", Number(poolAcc.amount) / 10 ** decimals);
    console.log("UserState:", {
      authority: userState.authority.toBase58(),
      amount: Number(userState.amount) / 10 ** decimals,
      locked: userState.locked,
      startTime: userState.startTime.toString(),
    });
    console.log("Pool:", {
      totalStaked: Number(pool.totalStaked) / 10 ** decimals,
      totalRewardsDistributed: Number(pool.totalRewardsDistributed) / 10 ** decimals,
      totalTaxCollected: Number(pool.totalTaxCollected) / 10 ** decimals,
    });
    console.log("--- End of Summary ---\n");
  });
});
