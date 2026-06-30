import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";
import { EgoshotEscrow } from "../target/types/egoshot_escrow";

const CONFIG_SEED = Buffer.from("config");
const MATCH_SEED = Buffer.from("match");
const MIN_BET = 10_000_000; // 0.01 SOL
const COMMISSION_BPS = 1_000; // 10%

function configPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

function matchPda(programId: PublicKey, matchId: bigint): [PublicKey, number] {
  const id = Buffer.alloc(8);
  id.writeBigUInt64LE(matchId);
  return PublicKey.findProgramAddressSync([MATCH_SEED, id], programId);
}

describe("egoshot-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EgoshotEscrow as Program<EgoshotEscrow>;
  const authority = (provider.wallet as anchor.Wallet).payer;
  const treasury = Keypair.generate();
  const creator = Keypair.generate();
  const opponent = Keypair.generate();

  const matchId = 42n;

  let config: PublicKey;
  let matchAccount: PublicKey;

  before(async () => {
    const airdrop = async (kp: Keypair, sol = 5) => {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        sol * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    };

    await airdrop(creator);
    await airdrop(opponent);

    [config] = configPda(program.programId);
    [matchAccount] = matchPda(program.programId, matchId);
  });

  it("initializes global config", async () => {
    await program.methods
      .initializeConfig(COMMISSION_BPS)
      .accounts({
        authority: authority.publicKey,
        treasury: treasury.publicKey,
        config,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const cfg = await program.account.config.fetch(config);
    expect(cfg.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(cfg.treasury.toBase58()).to.equal(treasury.publicKey.toBase58());
    expect(cfg.commissionBps).to.equal(COMMISSION_BPS);
  });

  it("creates a match with creator deposit", async () => {
    const before = await provider.connection.getBalance(creator.publicKey);

    await program.methods
      .createMatch(new anchor.BN(matchId.toString()), new anchor.BN(MIN_BET))
      .accounts({
        creator: creator.publicKey,
        config,
        matchAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const after = await provider.connection.getBalance(creator.publicKey);
    const matchData = await program.account.match.fetch(matchAccount);

    expect(after).to.be.lessThan(before - MIN_BET);
    expect(matchData.creator.toBase58()).to.equal(creator.publicKey.toBase58());
    expect(matchData.betAmount.toNumber()).to.equal(MIN_BET);
    expect(matchData.status).to.deep.equal({ waitingForOpponent: {} });
  });

  it("joins a match with opponent deposit", async () => {
    const before = await provider.connection.getBalance(opponent.publicKey);

    await program.methods
      .joinMatch()
      .accounts({
        opponent: opponent.publicKey,
        config,
        matchAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([opponent])
      .rpc();

    const after = await provider.connection.getBalance(opponent.publicKey);
    const matchData = await program.account.match.fetch(matchAccount);

    expect(after).to.be.lessThan(before - MIN_BET);
    expect(matchData.opponent.toBase58()).to.equal(opponent.publicKey.toBase58());
    expect(matchData.status).to.deep.equal({ active: {} });
  });

  it("settles match: winner receives pot minus commission", async () => {
    const totalPot = MIN_BET * 2;
    const commission = Math.floor((totalPot * COMMISSION_BPS) / 10_000);
    const payout = totalPot - commission;

    const winnerBefore = await provider.connection.getBalance(creator.publicKey);
    const treasuryBefore = await provider.connection.getBalance(
      treasury.publicKey
    );

    await program.methods
      .settleMatch(creator.publicKey)
      .accounts({
        authority: authority.publicKey,
        config,
        matchAccount,
        winner: creator.publicKey,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const winnerAfter = await provider.connection.getBalance(creator.publicKey);
    const treasuryAfter = await provider.connection.getBalance(treasury.publicKey);
    const matchData = await program.account.match.fetch(matchAccount);

    expect(winnerAfter - winnerBefore).to.equal(payout);
    expect(treasuryAfter - treasuryBefore).to.equal(commission);
    expect(matchData.status).to.deep.equal({ settled: {} });
  });

  it("closes a settled match and returns rent to creator", async () => {
    const before = await provider.connection.getBalance(creator.publicKey);

    await program.methods
      .closeMatch()
      .accounts({
        creator: creator.publicKey,
        matchAccount,
      })
      .signers([creator])
      .rpc();

    const after = await provider.connection.getBalance(creator.publicKey);
    expect(after).to.be.greaterThan(before);

    const info = await provider.connection.getAccountInfo(matchAccount);
    expect(info).to.be.null;
  });

  describe("cancel flow", () => {
    const cancelMatchId = 99n;
    let cancelMatch: PublicKey;

    before(async () => {
      [cancelMatch] = matchPda(program.programId, cancelMatchId);
    });

    it("creator can cancel before opponent joins", async () => {
      await program.methods
        .createMatch(
          new anchor.BN(cancelMatchId.toString()),
          new anchor.BN(MIN_BET)
        )
        .accounts({
          creator: creator.publicKey,
          config,
          matchAccount: cancelMatch,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const before = await provider.connection.getBalance(creator.publicKey);

      await program.methods
        .cancelMatch()
        .accounts({
          creator: creator.publicKey,
          matchAccount: cancelMatch,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const after = await provider.connection.getBalance(creator.publicKey);
      const matchData = await program.account.match.fetch(cancelMatch);

      expect(after).to.be.greaterThan(before);
      expect(matchData.status).to.deep.equal({ cancelled: {} });
    });
  });

  describe("refund flow", () => {
    const refundMatchId = 77n;
    let refundMatch: PublicKey;

    before(async () => {
      [refundMatch] = matchPda(program.programId, refundMatchId);

      await program.methods
        .createMatch(
          new anchor.BN(refundMatchId.toString()),
          new anchor.BN(MIN_BET)
        )
        .accounts({
          creator: creator.publicKey,
          config,
          matchAccount: refundMatch,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .joinMatch()
        .accounts({
          opponent: opponent.publicKey,
          config,
          matchAccount: refundMatch,
          systemProgram: SystemProgram.programId,
        })
        .signers([opponent])
        .rpc();
    });

    it("authority refunds both players on failed match", async () => {
      const creatorBefore = await provider.connection.getBalance(
        creator.publicKey
      );
      const opponentBefore = await provider.connection.getBalance(
        opponent.publicKey
      );

      await program.methods
        .refundMatch()
        .accounts({
          authority: authority.publicKey,
          config,
          matchAccount: refundMatch,
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const creatorAfter = await provider.connection.getBalance(creator.publicKey);
      const opponentAfter = await provider.connection.getBalance(opponent.publicKey);
      const matchData = await program.account.match.fetch(refundMatch);

      expect(creatorAfter - creatorBefore).to.equal(MIN_BET);
      expect(opponentAfter - opponentBefore).to.equal(MIN_BET);
      expect(matchData.status).to.deep.equal({ refunded: {} });
    });
  });
});
