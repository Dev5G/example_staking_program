import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { StakeProgram } from "../target/types/stake_program";

describe.skip("set_pause", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;
  const authority = provider.wallet as anchor.Wallet;

  // Constants
  const CONFIG_SEED = Buffer.from("config");
  
  let [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      program.programId
    );

  it("pauses the program", async () => {
    const tx = await program.methods
      .setPause(true)
      .accounts({
        config: configPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("Pause TX:", tx);

    const config = await program.account.config.fetch(configPda);
    assert.isTrue(config.paused, "Program should be paused");
  });

  it("unpauses the program", async () => {
    const tx = await program.methods
      .setPause(false)
      .accounts({
        config: configPda,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("Unpause TX:", tx);

    const config = await program.account.config.fetch(configPda);
    assert.isFalse(config.paused, "Program should be unpaused");
  });

  it("fails when unauthorized account tries to pause", async () => {
    const fakeAuthority = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .setPause(true)
        .accounts({
          config: configPda,
          authority: fakeAuthority.publicKey,
        })
        .signers([fakeAuthority])
        .rpc();
      assert.fail("Unauthorized account should not be able to pause");
    } catch (err) {
      assert.include(err.toString(), "Unauthorized", "Should throw Unauthorized error");
    }
  });
});
