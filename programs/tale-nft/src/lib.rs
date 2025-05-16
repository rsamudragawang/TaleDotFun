use anchor_lang::prelude::*;

// Program ID from your provided IDL
declare_id!("D4v7sUNHx1bsdHnBPMtZ2MeS1YssNk9iJqzCAQX3Qyik");

// --- Errors ---
#[error_code]
pub enum AppError {
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Invalid status value.")]
    InvalidStatus,
    #[msg("Candy Machine ID is too long.")]
    CandyMachineIdTooLong, // Keep if used elsewhere, or make more generic
    #[msg("Transaction signature string is too long.")]
    TxSignatureTooLong,    // Keep if used elsewhere
    #[msg("Mint activity already cancelled.")]
    MintActivityAlreadyCancelled, // Keep for existing functionality
    #[msg("Mint activity not found or already closed.")]
    MintActivityNotFound,         // Keep for existing functionality

    // Errors for ListedNft
    #[msg("NFT is already listed by this creator.")]
    NftAlreadyListed,
    #[msg("Listed NFT not found.")]
    ListedNftNotFound,
    #[msg("The NFT Mint address cannot be empty.")]
    NftMintAddressRequired,
    #[msg("The Candy Machine address cannot be empty.")]
    CandyMachineAddressRequired,
}

// --- Constants for String Lengths ---
const MAX_TX_SIGNATURE_LENGTH: usize = 88; // Solana Base58 signatures (for MintActivity)

// --- Account Struct Definitions ---

// Existing MintActivity struct (remains unchanged)
#[account]
pub struct MintActivity {
    pub user_wallet: Pubkey,
    pub candy_machine_id: Pubkey,
    pub nft_mint_address: Pubkey,
    pub transaction_signature: String,
    pub episode_on_chain_pda: Option<Pubkey>,
    pub timestamp: i64,
    pub status: u8, // Assumes 0 for Active, 1 for Cancelled from existing code
    pub bump: u8,
}

// Space for MintActivity (remains unchanged)
const MINT_ACTIVITY_ACCOUNT_SPACE: usize = 8 + 32 + 32 + 32 + (4+MAX_TX_SIGNATURE_LENGTH) + (1+32) + 8 + 1 + 1 + 32; // Added buffer, adjust if needed

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum MintActivityStatus { Active = 0, Cancelled = 1 } // Keep for existing functionality


// New ListedNft struct
#[account]
pub struct ListedNft {
    pub creator_wallet: Pubkey,         // Wallet that listed this NFT
    pub nft_mint_address: Pubkey,       // The mint address of the NFT itself
    pub candy_machine_address: Pubkey,  // Associated Candy Machine
    pub listed_at: i64,                 // Timestamp of listing
    pub bump: u8,                       // PDA bump seed
}

// Calculate space for ListedNft:
// 8 (discriminator) + 32 (creator_wallet) + 32 (nft_mint_address) + 32 (candy_machine_address) + 8 (listed_at) + 1 (bump)
// Total = 113 bytes. Add some buffer for future, e.g., 113 + 37 = 150
const LISTED_NFT_ACCOUNT_SPACE: usize = 8 + 32 + 32 + 32 + 8 + 1 + 37;


#[program]
pub mod tale_nft { // Module name from your IDL
    use super::*;

    // --- Existing Mint Activity Instructions (remain unchanged) ---
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

    // --- New ListedNft Instructions ---

    /// Creates a new listing record for an NFT.
    /// The `nft_mint_address` is the mint of the actual NFT being listed.
    /// The `candy_machine_address` is the CM it's associated with.
    pub fn list_nft(
        ctx: Context<ListNft>,
        nft_mint_address_arg: Pubkey,
        candy_machine_address_arg: Pubkey,
    ) -> Result<()> {
        // Basic validation for arguments
        if nft_mint_address_arg == Pubkey::default() {
            return err!(AppError::NftMintAddressRequired);
        }
        if candy_machine_address_arg == Pubkey::default() {
            return err!(AppError::CandyMachineAddressRequired);
        }

        let listed_nft = &mut ctx.accounts.listed_nft_account;
        listed_nft.creator_wallet = *ctx.accounts.creator_wallet.key;
        listed_nft.nft_mint_address = nft_mint_address_arg;
        listed_nft.candy_machine_address = candy_machine_address_arg;
        listed_nft.listed_at = Clock::get()?.unix_timestamp;
        listed_nft.bump = ctx.bumps.listed_nft_account;

        msg!(
            "NFT {} listed by {} for Candy Machine {}",
            listed_nft.nft_mint_address,
            listed_nft.creator_wallet,
            listed_nft.candy_machine_address
        );
        Ok(())
    }

    /// Updates the associated Candy Machine for a listed NFT.
    /// Only the original `creator_wallet` can update.
    pub fn update_listed_nft(
        ctx: Context<UpdateListedNft>,
        new_candy_machine_address_arg: Pubkey,
    ) -> Result<()> {
        if new_candy_machine_address_arg == Pubkey::default() {
            return err!(AppError::CandyMachineAddressRequired);
        }

        let listed_nft = &mut ctx.accounts.listed_nft_account;
        // `has_one = creator_wallet` in Context already verifies authority

        listed_nft.candy_machine_address = new_candy_machine_address_arg;
        // Optionally update timestamp or add an updated_at field if needed
        // listed_nft.listed_at = Clock::get()?.unix_timestamp; // Or an `updated_at` field

        msg!(
            "Listed NFT {} updated by {}. New Candy Machine: {}",
            listed_nft.nft_mint_address,
            listed_nft.creator_wallet,
            listed_nft.candy_machine_address
        );
        Ok(())
    }

    /// Removes (unlists) an NFT listing.
    /// Only the original `creator_wallet` can unlist.
    /// This closes the `ListedNft` account and returns lamports to the creator.
    pub fn unlist_nft(ctx: Context<UnlistNft>) -> Result<()> {
        // `has_one = creator_wallet` and `close = creator_wallet` in Context handle checks and closing.
        msg!(
            "NFT {} unlisted by {}. Associated CM was: {}",
            ctx.accounts.listed_nft_account.nft_mint_address,
            ctx.accounts.listed_nft_account.creator_wallet,
            ctx.accounts.listed_nft_account.candy_machine_address
        );
        Ok(())
    }
}


// --- Contexts ---

// Existing Mint Activity Contexts (remain unchanged)
#[derive(Accounts)]
#[instruction(candy_machine_id_arg: Pubkey)]
pub struct LogMintActivity<'info> {
    #[account(
        init,
        payer = user_wallet,
        space = MINT_ACTIVITY_ACCOUNT_SPACE,
        seeds = [
            b"mint_activity".as_ref(),
            user_wallet.key().as_ref(),
            candy_machine_id_arg.as_ref() // nft_mint_address is AccountInfo here
        ],
        bump
    )]
    pub mint_activity_account: Account<'info, MintActivity>,
    /// CHECK: This is the account of the minted NFT. We are just storing its address.
    pub nft_mint_address: AccountInfo<'info>, // This is the NFT that was actually minted
    #[account(mut)]
    pub user_wallet: Signer<'info>, // The wallet that performed the mint
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


// --- New ListedNft Contexts ---

#[derive(Accounts)]
#[instruction(nft_mint_address_arg: Pubkey)] // nft_mint_address_arg is used in seeds
pub struct ListNft<'info> {
    #[account(
        init,
        payer = creator_wallet,
        space = LISTED_NFT_ACCOUNT_SPACE,
        seeds = [
            b"listed_nft".as_ref(),
            creator_wallet.key().as_ref(),
            nft_mint_address_arg.as_ref() // Use the argument for PDA derivation
        ],
        bump
    )]
    pub listed_nft_account: Account<'info, ListedNft>,
    #[account(mut)]
    pub creator_wallet: Signer<'info>, // The wallet creating the listing
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateListedNft<'info> {
    #[account(
        mut,
        seeds = [
            b"listed_nft".as_ref(),
            creator_wallet.key().as_ref(), // or listed_nft_account.creator_wallet.as_ref()
            listed_nft_account.nft_mint_address.as_ref()
        ],
        bump = listed_nft_account.bump,
        has_one = creator_wallet @ AppError::Unauthorized // Ensures only the creator can update
    )]
    pub listed_nft_account: Account<'info, ListedNft>,
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnlistNft<'info> {
    #[account(
        mut,
        seeds = [
            b"listed_nft".as_ref(),
            creator_wallet.key().as_ref(), // or listed_nft_account.creator_wallet.as_ref()
            listed_nft_account.nft_mint_address.as_ref()
        ],
        bump = listed_nft_account.bump,
        has_one = creator_wallet @ AppError::Unauthorized, // Ensures only the creator can unlist
        close = creator_wallet // The account to send lamports to when closed
    )]
    pub listed_nft_account: Account<'info, ListedNft>,
    #[account(mut)]
    pub creator_wallet: Signer<'info>,
}
