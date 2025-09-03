import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { StakeProgram } from "../target/types/stake_program";
import {
  getAssociatedTokenAddressSync,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";

import { toDecimals } from "./utils"; // your helper fn: toDecimals(10, decimals)

describe.skip("staking + rewards flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const wallet = provider.wallet as anchor.Wallet;
  const tokenMint=  new anchor.web3.PublicKey("7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX");

  let userATA: anchor.web3.PublicKey;
  const randomWallet =  anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode("DgvJSyaZm6Mj7VVdRLqNPLyoycANiJzAV4uoLSQfLkJ13YvSCSHGwo45xY8WwdpRS3AkWhv5fR52rNG9ajdKMg7"));
  let randomATA: anchor.web3.PublicKey;

  const decimals = 6;

  before(async () => {
    

    // Anchor wallet ATA
    userATA = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey);

    // Random wallet for staking
    randomATA = getAssociatedTokenAddressSync(tokenMint, randomWallet.publicKey);
  });

  it("Anchor wallet stakes 20 tokens", async () => {
    const stakeAmount = new anchor.BN(toDecimals(20, decimals));
    await program.methods
      .stake(stakeAmount)
      .accounts({
        user: wallet.publicKey,
      })
      .rpc();

    const userBalance = await provider.connection.getTokenAccountBalance(userATA);
    console.log("Anchor wallet ATA after staking:", userBalance.value.uiAmountString);

    // assert.ok(Number(userBalance.value.amount) <= toDecimals(30, decimals));
  });

  it("Random wallet stakes 20 tokens", async () => {
    const stakeAmount = new anchor.BN(toDecimals(20, decimals));
    await program.methods
      .stake(stakeAmount)
      .accounts({
        user: randomWallet.publicKey,
      })
      .signers([randomWallet]) // must sign
      
      .rpc();

    const bal = await provider.connection.getTokenAccountBalance(randomATA);
    console.log("Random wallet ATA after staking:", bal.value.uiAmountString);
    // assert.ok(Number(bal.value.amount) <= toDecimals(30, decimals));
  });

  it("Random wallet unstakes successfully", async () => {
    const communityWallet = new anchor.web3.PublicKey(
      "CHNWJVCFagNp6iKHr4BLXs6otVpzUhNv8E6jvwN9j8zf"
    );

    await program.methods
      .unstake()
      .accounts({
        user: randomWallet.publicKey,
        communityWallet,
      })
      .signers([randomWallet])
      .rpc();

    const bal = await provider.connection.getTokenAccountBalance(randomATA);
    console.log("Random wallet ATA after unstake:", bal.value.uiAmountString);

    assert.ok(Number(bal.value.amount) > 0, "Random wallet received unstaked tokens");
  });

  it("Anchor wallet claims rewards successfully", async () => {
    await program.methods
      .claimRewards()
      .accounts({
        user: wallet.publicKey,
      })
      .rpc();

    const userBalance = await provider.connection.getTokenAccountBalance(userATA);
    console.log("Anchor wallet ATA after claim:", userBalance.value.uiAmountString);

    assert.ok(Number(userBalance.value.amount) > 0, "Anchor wallet got rewards");
  });

  // ---- Edge Cases ----

  it("Fails to claim when nothing to claim", async () => {
    try {
      await program.methods
        .claimRewards()
        .accounts({
          user: wallet.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err) {
    //   assert.ok(err.toString().includes("NothingToClaim"));
        console.log("Expected error (nothing to claim):", err.toString());
    }
  });

  it("Fails to unstake more than staked", async () => {
    try {
      const communityWallet = new anchor.web3.PublicKey(
        "CHNWJVCFagNp6iKHr4BLXs6otVpzUhNv8E6jvwN9j8zf"
      );
      await program.methods
        .unstake()
        .accounts({
          user: wallet.publicKey,
          communityWallet,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err) {
      console.log("Expected error (no stake left):", err.toString());
    }
  });

  it("Fails to stake 0 tokens", async () => {
    try {
      await program.methods
        .stake(new anchor.BN(0))
        .accounts({
          user: wallet.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err) {
      console.log("Expected error (stake 0):", err.toString());
    }
  });
  it("Prints summary of stakes and pool", async () => {
      const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
          );
        const  [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("pool")],
            program.programId
          );
      const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("state"), wallet.publicKey.toBuffer(), configPda.toBuffer()],
            program.programId
          );
      
        const  stakerAta = getAssociatedTokenAddressSync(
            tokenMint,
            wallet.publicKey
          );
        const  poolVault = getAssociatedTokenAddressSync(
            tokenMint,
            poolPda,
            true
          );
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
