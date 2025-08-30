# Stake Program

This project is a Solana smart contract (program) for staking, built using [Anchor](https://github.com/solana-foundation/anchor). It allows users to stake tokens, manage vaults, and claim rewards, with a modular and extensible architecture.

## Project Structure

- `programs/stake_program/`: Rust source code for the on-chain staking program.
- `migrations/`: Deployment scripts.
- `app/`: (Optional) Frontend or client-side code.
- `tests/`: JavaScript/TypeScript tests using Mocha and Chai.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html)

## Setup

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Build the Solana program:**

   ```sh
   anchor build
   ```

3. **Run tests:**

   ```sh
   anchor test
   ```

4. **Deploy the program (to localnet):**

   ```sh
   anchor deploy
   ```

## Linting

Format and check code style using Prettier:

```sh
npm run lint      # Check formatting
npm run lint:fix  # Auto-fix formatting
```

## License

ISC

---

For more details, see the source files in [`program