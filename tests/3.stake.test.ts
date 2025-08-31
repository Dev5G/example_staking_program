import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { assert } from "chai";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { toDecimals } from "./utils";

describe.skip("Stake tests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const provider = program.provider as anchor.AnchorProvider;
  const payer = provider.wallet;
  const tokenMint = new anchor.web3.PublicKey("7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX");

  let stakerAta: anchor.web3.PublicKey;
  let poolVault: anchor.web3.PublicKey;

  let configPda: anchor.web3.PublicKey;
  let poolPda: anchor.web3.PublicKey;
  let userStatePda: anchor.web3.PublicKey;

  const decimals = 6;
  const initialMintAmount= toDecimals(100_000_000, decimals);
  const stakeAmount = new anchor.BN(toDecimals(10, decimals)); // 10 tokens

  before(async () => {
    

    // --- 2. Create ATA for staker ---
    stakerAta = getAssociatedTokenAddressSync(tokenMint, payer.publicKey);
    // --- 4. Derive PDAs ---
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

    // --- 5. Derive pool vault ATA ---
    poolVault = await getAssociatedTokenAddress(tokenMint, poolPda, true);
  });

  it("Stake works and updates state", async () => {
    // call stake
    await program.methods
      .stake(stakeAmount)
      .accounts({
        user: payer.publicKey,
      })
      .rpc();

    // Check balances
    const stakerAcc = await getAccount(provider.connection, stakerAta);
    const poolAcc = await getAccount(provider.connection, poolVault);
    console.log("Staker ATA balance:", Number(stakerAcc.amount) / 10 ** decimals);
    assert.equal(
      stakerAcc.amount.toString(),
      (initialMintAmount - BigInt(stakeAmount.toString())).toString(),
      "Staker ATA balance should decrease"
    );
    assert.equal(
      poolAcc.amount.toString(),
      stakeAmount.toString(),
      "Pool vault should hold the staked amount"
    );

    // Check state
    const userState = await program.account.userState.fetch(userStatePda);
    const pool = await program.account.stakingPool.fetch(poolPda);

    assert.equal(userState.amount.toString(), stakeAmount.toString());
    assert.equal(pool.totalStaked.toString(), stakeAmount.toString());
    assert.isTrue(userState.locked, "User should be locked after stake");
  });


  it("Fails with insufficient funds", async () => {
    try {
      await program.methods
        .stake(new anchor.BN(toDecimals(1000_000_000, decimals))) // way more than balance
        .accounts({
          user: payer.publicKey,
          })
        .rpc();
      assert.fail("Stake should fail with insufficient funds");
    } catch (err) {
      console.log("✅ Expected fail (insufficient funds):", err.error.errorMessage);
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
