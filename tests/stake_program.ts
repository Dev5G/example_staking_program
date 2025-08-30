import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";

describe("stake_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.stakeProgram as Program<StakeProgram>;
  const provider = program.provider as anchor.AnchorProvider;
  const payer = provider.wallet;

  const communityWallet = anchor.web3.Keypair.generate();
  it("Is initialized!", async () => {
    // Add your test here.
    // const tx = await program.methods.initialize(
      
    // ).rpc();
    // console.log("Your transaction signature", tx);

    console.log("Program ID: ", program.programId.toString());
    console.log("Payer: ", payer.publicKey.toString());
    console.log("Community Wallet: ", communityWallet.publicKey.toString());
  });
});
