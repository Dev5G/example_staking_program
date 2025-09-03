import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { StakeProgram } from "../target/types/stake_program";
import {
  getAssociatedTokenAddressSync,
  createMint,
  mintTo,
} from "@solana/spl-token";

describe("manual_rewards", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const tokenMint=  new anchor.web3.PublicKey("7NqY72YxCFwBgQpHSySkTPv9DYr5Y4neKLDmUCp6ZEEX");
  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const wallet = provider.wallet as anchor.Wallet;

  const randomWallet =  anchor.web3.Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode("xcJmJmntNwe3oVne9q7SUanyCfM9fqWxYKisTrwMdMcDxZRTxrCdqBnZQ8SB6PpSkt2RWKt4CnFNVYcdrEBo8rv"));
  
  
  // PDAs
  const  [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  const  [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    program.programId
  );
  const decimals = 6;
  // ATAs
   const  poolVaultATA = getAssociatedTokenAddressSync(tokenMint, poolPDA, true);

  const userATA = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey);
  const randomATA = getAssociatedTokenAddressSync(tokenMint, randomWallet.publicKey);

  it("authority adds rewards manually", async () => {
    await program.methods
      .addRewards(new anchor.BN(100_000_000)) // 100 tokens
      .accounts({
        authority: wallet.publicKey,
      })
      .rpc();

    const poolVaultAcc =
      await program.provider.connection.getTokenAccountBalance(poolVaultATA);
    assert.ok(Number(poolVaultAcc.value.amount) > 0, "Pool vault should hold rewards");
  });

  it("users can claim rewards after manual add", async () => {
    // User stakes 20 tokens
    // await program.methods
    //   .stake(new anchor.BN(20 * 10 ** decimals))
    //   .accounts({ user: wallet.publicKey })
    //   .rpc();

    // // Random user stakes 20 tokens
    // await program.methods
    //   .stake(new anchor.BN(20 * 10 ** decimals))
    //   .accounts({ user: randomUser.publicKey })
    //   .signers([randomUser])
    //   .rpc();

    // // Random user unstakes (generates tax for pool)
    // await program.methods
    //   .unstake()
    //   .accounts({
    //     user: randomUser.publicKey,
    //     communityWallet: wallet.publicKey, // assume test uses wallet as community
    //   })
    //   .signers([randomUser])
    //   .rpc();

    // Wallet claims rewards
    await program.methods
      .claimRewards()
      .accounts({
        user: randomWallet.publicKey,
      })
      .signers([randomWallet])
      .rpc();

    const userAcc =
      await program.provider.connection.getTokenAccountBalance(randomATA);
    console.log("Wallet received:", userAcc.value.uiAmountString);

    assert.ok(Number(userAcc.value.amount) > 0, "User should get rewards");
  });

  // it("fails if non-authority tries to add rewards", async () => {
  //   try {
  //     await program.methods
  //       .addRewards(new anchor.BN(50_000_000))
  //       .accounts({
  //         config: configPDA,
  //         pool: poolPDA,
  //         authority: randomUser.publicKey,
  //         from: randomUserATA,
  //         poolVault: poolVaultATA,
  //       })
  //       .signers([randomUser])
  //       .rpc();
  //     assert.fail("Should have thrown Unauthorized error");
  //   } catch (err) {
  //     assert.ok(err.toString().includes("Unauthorized"));
  //   }
  // });
});
