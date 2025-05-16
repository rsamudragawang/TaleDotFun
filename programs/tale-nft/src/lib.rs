use anchor_lang::prelude::*;

// Program ID from your provided IDL
declare_id!("GzummSyWSKsn6eLH5a3iUoFWw8kuF6NFHa7VpLFqWKnh");

// --- Errors ---
#[error_code]
pub enum AppError {
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Invalid status value.")]
    InvalidStatus,
    #[msg("Candy Machine ID is too long.")]
    CandyMachineIdTooLong,
    #[msg("Transaction signature string is too long.")]
    TxSignatureTooLong,
    #[msg("Mint activity already cancelled.")]
    MintActivityAlreadyCancelled,
    #[msg("Mint activity not found or already closed.")]
    MintActivityNotFound,
}

// --- Constants for String Lengths ---
const MAX_TX_SIGNATURE_LENGTH: usize = 88; // Solana Base58 signatures

#[account]
pub struct MintActivity {
    pub user_wallet: Pubkey,
    pub candy_machine_id: Pubkey,
    pub nft_mint_address: Pubkey,
    pub transaction_signature: String,
    pub episode_on_chain_pda: Option<Pubkey>,
    pub timestamp: i64,
    pub status: u8,
    pub bump: u8,
}

const MINT_ACTIVITY_ACCOUNT_SPACE: usize = 8 + 32 + 32 + 32 + (4+88) + (1+32) + 8 + 1 + 1 + 32;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum MintActivityStatus { Active = 0, Cancelled = 1 }

#[program]
pub mod tale_nft { // Module name from your IDL
    use super::*;

    // --- Mint Activity Instructions ---
    pub fn log_mint_activity(
        ctx: Context<LogMintActivity>,
        candy_machine_id_arg: Pubkey,
        transaction_signature_str: String,
        episode_on_chain_pda_option: Option<Pubkey>,
    ) -> Result<()> {
        if transaction_signature_str.len() > MAX_TX_SIGNATURE_LENGTH {
            return err!(AppError::TxSignatureTooLong);
        }

        let activity = &mut ctx.accounts.mint_activity_account;
        activity.user_wallet = *ctx.accounts.user_wallet.key;
        activity.candy_machine_id = candy_machine_id_arg;
        activity.nft_mint_address = *ctx.accounts.nft_mint_address.key;
        activity.transaction_signature = transaction_signature_str;
        activity.episode_on_chain_pda = episode_on_chain_pda_option;
        activity.timestamp = Clock::get()?.unix_timestamp;
        activity.status = MintActivityStatus::Active as u8;
        activity.bump = ctx.bumps.mint_activity_account;

        msg!(
            "Mint activity logged for NFT: {}, by User: {}, from CM: {}",
            activity.nft_mint_address,
            activity.user_wallet,
            activity.candy_machine_id
        );
        Ok(())
    }

    pub fn cancel_mint_activity(ctx: Context<CancelMintActivity>) -> Result<()> {
        let activity = &mut ctx.accounts.mint_activity_account;

        if activity.status == MintActivityStatus::Cancelled as u8 {
            return err!(AppError::MintActivityAlreadyCancelled);
        }
        activity.status = MintActivityStatus::Cancelled as u8;
        activity.timestamp = Clock::get()?.unix_timestamp;

        msg!(
            "Mint activity for NFT: {} cancelled by User: {}",
            activity.nft_mint_address,
            activity.user_wallet
        );
        Ok(())
    }

    pub fn close_mint_activity_account(ctx: Context<CloseMintActivityAccount>) -> Result<()> {
        msg!(
            "Mint activity account for NFT: {} closed by User: {}",
            ctx.accounts.mint_activity_account.nft_mint_address,
            ctx.accounts.mint_activity_account.user_wallet
        );
        Ok(())
    }
}


// --- Contexts ---

// Mint Activity Contexts
#[derive(Accounts)]
#[instruction(candy_machine_id_arg: Pubkey, transaction_signature_str: String, episode_on_chain_pda_option: Option<Pubkey>)]
pub struct LogMintActivity<'info> {
    #[account(
        init,
        payer = user_wallet,
        space = MINT_ACTIVITY_ACCOUNT_SPACE,
        seeds = [
            b"mint_activity".as_ref(),
            user_wallet.key().as_ref(),
            nft_mint_address.key().as_ref()
        ],
        bump
    )]
    pub mint_activity_account: Account<'info, MintActivity>,
    /// CHECK: This is the account of the minted NFT. We are just storing its address.
    pub nft_mint_address: AccountInfo<'info>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMintActivity<'info> {
    #[account(
        mut,
        seeds = [
            b"mint_activity".as_ref(),
            user_wallet.key().as_ref(),
            mint_activity_account.nft_mint_address.as_ref()
        ],
        bump = mint_activity_account.bump,
        has_one = user_wallet
    )]
    pub mint_activity_account: Account<'info, MintActivity>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseMintActivityAccount<'info> {
    #[account(
        mut,
        seeds = [
            b"mint_activity".as_ref(),
            user_wallet.key().as_ref(),
            mint_activity_account.nft_mint_address.as_ref()
        ],
        bump = mint_activity_account.bump,
        has_one = user_wallet,
        close = user_wallet
    )]
    pub mint_activity_account: Account<'info, MintActivity>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
}
