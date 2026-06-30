use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub commission_bps: u16,
}

#[event]
pub struct MatchCreated {
    pub match_id: u64,
    pub creator: Pubkey,
    pub bet_amount: u64,
}

#[event]
pub struct MatchJoined {
    pub match_id: u64,
    pub opponent: Pubkey,
}

#[event]
pub struct MatchSettled {
    pub match_id: u64,
    pub winner: Pubkey,
    pub payout: u64,
    pub commission: u64,
}

#[event]
pub struct MatchCancelled {
    pub match_id: u64,
    pub creator: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct MatchRefunded {
    pub match_id: u64,
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub refund_each: u64,
}
