use anchor_lang::prelude::*;

#[error_code]
pub enum EgoShotError {
    #[msg("Commission exceeds maximum allowed (2500 bps)")]
    CommissionTooHigh,
    #[msg("Bet amount is below minimum (0.1 SOL)")]
    BetTooLow,
    #[msg("Match is not waiting for an opponent")]
    MatchNotWaiting,
    #[msg("Match is not active")]
    MatchNotActive,
    #[msg("Creator cannot join their own match")]
    CannotJoinOwnMatch,
    #[msg("Winner must be the creator or opponent")]
    InvalidWinner,
    #[msg("Only the match creator can cancel")]
    UnauthorizedCancel,
    #[msg("Signer is not the configured authority")]
    UnauthorizedAuthority,
    #[msg("Match is not in a terminal state")]
    MatchNotTerminal,
    #[msg("Match vault has insufficient lamports")]
    InsufficientVaultBalance,
    #[msg("Invalid commission configuration")]
    InvalidCommission,
}
