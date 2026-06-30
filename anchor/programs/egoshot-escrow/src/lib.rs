use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub mod error;
pub mod events;
pub mod state;

use error::EgoShotError;
use events::*;
use state::*;

declare_id!("TnSD3tZioHAS3io84WNAUyhzuWQr7jerh3mp1iHBfsi");

#[program]
pub mod egoshot_escrow {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        commission_bps: u16,
    ) -> Result<()> {
        require!(
            commission_bps <= MAX_COMMISSION_BPS,
            EgoShotError::CommissionTooHigh
        );

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.treasury = ctx.accounts.treasury.key();
        config.commission_bps = commission_bps;
        config.bump = ctx.bumps.config;

        emit!(ConfigInitialized {
            authority: config.authority,
            treasury: config.treasury,
            commission_bps,
        });

        Ok(())
    }

    pub fn create_match(ctx: Context<CreateMatch>, match_id: u64, bet_amount: u64) -> Result<()> {
        require!(bet_amount >= MIN_BET_LAMPORTS, EgoShotError::BetTooLow);

        let match_account = &mut ctx.accounts.match_account;
        match_account.match_id = match_id;
        match_account.creator = ctx.accounts.creator.key();
        match_account.opponent = Pubkey::default();
        match_account.bet_amount = bet_amount;
        match_account.status = MatchStatus::WaitingForOpponent;
        match_account.bump = ctx.bumps.match_account;

        transfer_lamports(
            &ctx.accounts.creator.to_account_info(),
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            bet_amount,
            None,
        )?;

        emit!(MatchCreated {
            match_id,
            creator: match_account.creator,
            bet_amount,
        });

        Ok(())
    }

    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            EgoShotError::MatchNotWaiting
        );
        require!(
            match_account.creator != ctx.accounts.opponent.key(),
            EgoShotError::CannotJoinOwnMatch
        );

        let bet_amount = match_account.bet_amount;
        match_account.opponent = ctx.accounts.opponent.key();
        match_account.status = MatchStatus::Active;

        transfer_lamports(
            &ctx.accounts.opponent.to_account_info(),
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            bet_amount,
            None,
        )?;

        emit!(MatchJoined {
            match_id: match_account.match_id,
            opponent: match_account.opponent,
        });

        Ok(())
    }

    pub fn settle_match(ctx: Context<SettleMatch>, winner: Pubkey) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let config = &ctx.accounts.config;

        require!(
            match_account.status == MatchStatus::Active,
            EgoShotError::MatchNotActive
        );
        require!(match_account.is_participant(&winner), EgoShotError::InvalidWinner);

        let total_pot = match_account
            .bet_amount
            .checked_mul(2)
            .ok_or(EgoShotError::InsufficientVaultBalance)?;
        let commission = calculate_commission(total_pot, config.commission_bps)?;
        let payout = total_pot
            .checked_sub(commission)
            .ok_or(EgoShotError::InsufficientVaultBalance)?;

        let match_id_bytes = match_account.match_id.to_le_bytes();
        let signer_seeds = match_signer_seeds(
            &match_id_bytes,
            match_account.bump,
        );

        transfer_lamports(
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.winner.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            payout,
            Some(&signer_seeds),
        )?;

        if commission > 0 {
            transfer_lamports(
                &ctx.accounts.match_account.to_account_info(),
                &ctx.accounts.treasury.to_account_info(),
                &ctx.accounts.system_program.to_account_info(),
                commission,
                Some(&signer_seeds),
            )?;
        }

        match_account.status = MatchStatus::Settled;

        emit!(MatchSettled {
            match_id: match_account.match_id,
            winner,
            payout,
            commission,
        });

        Ok(())
    }

    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            EgoShotError::MatchNotWaiting
        );
        require!(
            match_account.creator == ctx.accounts.creator.key(),
            EgoShotError::UnauthorizedCancel
        );

        let refund_amount = match_account.bet_amount;
        let match_id_bytes = match_account.match_id.to_le_bytes();
        let signer_seeds = match_signer_seeds(
            &match_id_bytes,
            match_account.bump,
        );

        transfer_lamports(
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.creator.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            refund_amount,
            Some(&signer_seeds),
        )?;

        match_account.status = MatchStatus::Cancelled;

        emit!(MatchCancelled {
            match_id: match_account.match_id,
            creator: match_account.creator,
            refund_amount,
        });

        Ok(())
    }

    /// Authority refunds both players when an active match cannot be completed.
    pub fn refund_match(ctx: Context<RefundMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::Active,
            EgoShotError::MatchNotActive
        );

        let bet_amount = match_account.bet_amount;
        let match_id_bytes = match_account.match_id.to_le_bytes();
        let signer_seeds = match_signer_seeds(
            &match_id_bytes,
            match_account.bump,
        );

        transfer_lamports(
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.creator.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            bet_amount,
            Some(&signer_seeds),
        )?;

        transfer_lamports(
            &ctx.accounts.match_account.to_account_info(),
            &ctx.accounts.opponent.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            bet_amount,
            Some(&signer_seeds),
        )?;

        match_account.status = MatchStatus::Refunded;

        emit!(MatchRefunded {
            match_id: match_account.match_id,
            creator: match_account.creator,
            opponent: match_account.opponent,
            refund_each: bet_amount,
        });

        Ok(())
    }

    /// Reclaim rent after a terminal match state. Only the creator may close.
    pub fn close_match(ctx: Context<CloseMatch>) -> Result<()> {
        let match_account = &ctx.accounts.match_account;
        require!(
            matches!(
                match_account.status,
                MatchStatus::Settled | MatchStatus::Cancelled | MatchStatus::Refunded
            ),
            EgoShotError::MatchNotTerminal
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury receives commission payouts; validated against config on settle.
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = Config::LEN,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct CreateMatch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = creator,
        space = Match::LEN,
        seeds = [MATCH_SEED, match_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub match_account: Account<'info, Match>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub opponent: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
    )]
    pub match_account: Account<'info, Match>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(
        constraint = authority.key() == config.authority @ EgoShotError::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK: Validated in instruction; receives the winner payout.
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,

    /// CHECK: Must match config treasury.
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ EgoShotError::InvalidCommission
    )]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        has_one = creator @ EgoShotError::UnauthorizedCancel,
    )]
    pub match_account: Account<'info, Match>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundMatch<'info> {
    #[account(
        constraint = authority.key() == config.authority @ EgoShotError::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK: Must be the match creator.
    #[account(
        mut,
        constraint = creator.key() == match_account.creator @ EgoShotError::InvalidWinner
    )]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: Must be the match opponent.
    #[account(
        mut,
        constraint = opponent.key() == match_account.opponent @ EgoShotError::InvalidWinner
    )]
    pub opponent: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseMatch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        has_one = creator @ EgoShotError::UnauthorizedCancel,
    )]
    pub match_account: Account<'info, Match>,
}

fn calculate_commission(total: u64, commission_bps: u16) -> Result<u64> {
    let commission = (total as u128)
        .checked_mul(commission_bps as u128)
        .and_then(|v| v.checked_div(10_000))
        .and_then(|v| u64::try_from(v).ok())
        .ok_or(EgoShotError::InvalidCommission)?;
    Ok(commission)
}

fn match_signer_seeds<'a>(match_id_bytes: &'a [u8; 8], bump: u8) -> [&'a [u8]; 3] {
    [MATCH_SEED, match_id_bytes.as_ref(), &[bump]]
}

fn transfer_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }

    let accounts = system_program::Transfer {
        from: from.clone(),
        to: to.clone(),
    };

    let cpi_ctx = match signer_seeds {
        Some(seeds) => CpiContext::new_with_signer(system_program.clone(), accounts, seeds),
        None => CpiContext::new(system_program.clone(), accounts),
    };

    system_program::transfer(cpi_ctx, amount)
}
