use anchor_lang::prelude::*;

pub const CONFIG_SEED: &[u8] = b"config";
pub const MATCH_SEED: &[u8] = b"match";
pub const MIN_BET_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
pub const MAX_COMMISSION_BPS: u16 = 2_500; // 25%

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MatchStatus {
    WaitingForOpponent = 0,
    Active = 1,
    Settled = 2,
    Cancelled = 3,
    Refunded = 4,
}

impl MatchStatus {
    pub const LEN: usize = 1;
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub commission_bps: u16,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 1;
}

#[account]
pub struct Match {
    pub match_id: u64,
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub bet_amount: u64,
    pub status: MatchStatus,
    pub bump: u8,
}

impl Match {
    pub const LEN: usize = 8 + 8 + 32 + 32 + 8 + MatchStatus::LEN + 1;

    pub fn is_participant(&self, key: &Pubkey) -> bool {
        self.creator == *key || self.opponent == *key
    }

    pub fn expected_vault_balance(&self) -> u64 {
        match self.status {
            MatchStatus::WaitingForOpponent => self.bet_amount,
            MatchStatus::Active => self.bet_amount.saturating_mul(2),
            _ => 0,
        }
    }
}
