// programs/readium-fun/src/lib.rs
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::invoke,
    system_instruction,
    // system_program, // Keep commented unless needed for system_program::ID explicitly
};
// Import necessary items from mpl-core - Adjust paths based on mpl-core vX.Y.Z source/docs
use mpl_core::{
    instructions::{
        CreateV1Cpi, // Assuming this is the CPI struct/builder
        CreateV1InstructionArgs, // Assuming this holds the args
    },
    types::{ // Try importing types directly
        DataState,
        PluginAuthorityPair,
        UpdateAuthority,
        TokenStandard, // Assuming it's here
        AssetData, // Assuming it's here, maybe needed for plugins later
    },
    ID as MplCoreProgramId,
    accounts::CreateV1 as MplCoreCreateV1Accounts, // Let's TRY this import again based on compiler hint
};

// Use bs58 for event data encoding
use bs58;
declare_id!("EZ1GQumWC4UwwQBGERwtnMNS6rJRprjP1HhGfhLC2utJ");

// --- Constants for PDA Seeds ---
const PLATFORM_CONFIG_SEED: &[u8] = b"platform_config_v1";
const DESIGN_STATE_SEED: &[u8] = b"design_v1";

#[program]
pub mod readium_fun {
     use super::*; // Imports items from the outer scope (constants, structs, errors)

    // --- Instruction 1: Initialize Platform Config ---
    // Creates a global configuration account for the platform (admin-only).
    pub fn initialize_platform_config(
        ctx: Context<InitializePlatformConfig>,
        fee_basis_points: u16,
    ) -> Result<()> {
        require!(fee_basis_points <= 10000, CustomError::FeeTooHigh);
        let config = &mut ctx.accounts.platform_config;
        config.admin = ctx.accounts.admin.key();
        config.fee_wallet = ctx.accounts.platform_fee_wallet.key();
        config.fee_basis_points = fee_basis_points;
        // config.bump = *ctx.bumps.get("platform_config").unwrap(); // REMOVED
        msg!("Platform config initialized. Fee wallet: {}, Fee BPS: {}", config.fee_wallet, config.fee_basis_points);
        Ok(())
    }

    // --- Instruction 2: Register a New Design ---
    pub fn register_design(
        ctx: Context<RegisterDesign>,
        design_id_hash: [u8; 32],
        shared_metadata_uri: String,
        price_per_purchase_lamports: u64,
        total_slots: u16,
    ) -> Result<()> {
        require!(total_slots > 0, CustomError::TotalSlotsCannotBeZero);
        require!(!shared_metadata_uri.is_empty(), CustomError::UriLengthInvalid);
        require!(shared_metadata_uri.len() <= 200, CustomError::UriLengthInvalid);

        let design = &mut ctx.accounts.design_state;
        design.creator = ctx.accounts.creator.key();
        design.design_id_hash = design_id_hash;
        design.shared_metadata_uri = shared_metadata_uri;
        design.price_per_purchase_lamports = price_per_purchase_lamports;
        design.total_slots = total_slots;
        design.slots_purchased = 0;
        design.is_initialized = true;
        // design.bump = *ctx.bumps.get("design_state").unwrap(); // REMOVED

        msg!("Design registered by {}. ID Hash: {:?}, Price: {}, Slots: {}",
            design.creator, design.design_id_hash, design.price_per_purchase_lamports, design.total_slots);
        Ok(())
    }

    // --- Instruction 3: Purchase a Slot and Mint Numbered Edition ---
    pub fn purchase_and_mint_slot(
        ctx: Context<PurchaseAndMintSlot>,
        _design_id_hash: [u8; 32],
    ) -> Result<()> {
        // --- Account Access ---
        let design = &mut ctx.accounts.design_state;
        let config = &ctx.accounts.platform_config;
        let buyer = &ctx.accounts.buyer;
        let creator_account_info = &ctx.accounts.creator_account;
        let platform_fee_wallet_account_info = &ctx.accounts.platform_fee_wallet_account;
        let new_core_asset_mint_account_info = ctx.accounts.new_core_asset_mint.to_account_info();
        let system_program_info = ctx.accounts.system_program.to_account_info();
        let mpl_core_program = &ctx.accounts.mpl_core_program; // Use Program<'info, MplCore>

        // --- Validation ---
        require!(design.is_initialized, CustomError::DesignNotInitialized);
        require!(design.slots_purchased < design.total_slots, CustomError::SoldOut);

        let current_purchase_number = design.slots_purchased.checked_add(1).ok_or(CustomError::ArithmeticError)?;
        let price = design.price_per_purchase_lamports;

        // --- 1. Payments ---
        let platform_fee = price.checked_mul(config.fee_basis_points as u64)
                                .ok_or(CustomError::ArithmeticError)?
                                .checked_div(10000)
                                .ok_or(CustomError::ArithmeticError)?;
        let creator_amount = price.checked_sub(platform_fee).ok_or(CustomError::ArithmeticError)?;

        msg!("Processing payment: Total={}, CreatorShare={}, PlatformFee={}", price, creator_amount, platform_fee);

        // Transfer to Creator
        if creator_amount > 0 {
             invoke(
                 &system_instruction::transfer(buyer.key, creator_account_info.key, creator_amount),
                 &[ buyer.to_account_info(), creator_account_info.clone(), system_program_info.clone() ],
             )?;
        }

        // Transfer to Platform Fee Wallet
        if platform_fee > 0 {
             invoke(
                 &system_instruction::transfer(buyer.key, platform_fee_wallet_account_info.key, platform_fee),
                 &[ buyer.to_account_info(), platform_fee_wallet_account_info.clone(), system_program_info.clone() ],
             )?;
        }

        // --- 2. Mint Metaplex Core NFT via CPI ---
        msg!("Preparing to mint Core NFT...");
        let base_name = "MyNFT"; // TODO: Get base name properly
        let asset_name = format!("{} #{}", base_name, current_purchase_number);
         msg!("   Asset Name: {}", asset_name);
         msg!("   Metadata URI: {}", design.shared_metadata_uri);

        let plugins: Option<Vec<PluginAuthorityPair>> = None; // No plugins for simplicity

        // --- REVISED CPI CALL ---
        // Use the CreateV1Cpi builder pattern if available from mpl_core
        // This pattern is common with Anchor CPI helpers generated by Seahorse or manually.
        // CHECK MPL-CORE documentation for the exact builder pattern or CPI function.

        // Assuming a builder pattern exists, initiated via the program reference:
        CreateV1Cpi::new(
            &mpl_core_program.to_account_info(), // Target program
            // Accounts struct required by CreateV1Cpi
            MplCoreCreateV1Accounts { // Use the imported accounts struct
                asset: new_core_asset_mint_account_info.clone(),
                collection: None,
                authority: Some(buyer.to_account_info()),
                payer: buyer.to_account_info(),
                owner: Some(buyer.to_account_info()),
                update_authority: Some(buyer.to_account_info()), // Pass AccountInfo directly
                system_program: system_program_info.clone(),
                log_wrapper: None,
            },
            // Arguments struct required by CreateV1Cpi
            CreateV1InstructionArgs { // Use the imported args struct
                data_state: DataState::AccountState,
                name: asset_name,
                uri: design.shared_metadata_uri.clone(),
                plugins,
                // Put fields back directly if AssetData struct wasn't found/used
                symbol: Some("NUMED".to_string()),
                seller_fee_basis_points: Some(500), // Example 5%
                is_mutable: Some(true), // Needs to be Option<bool> likely
                // Other fields like primary_sale_happened, token_standard might be needed
                 primary_sale_happened: Some(false),
                 token_standard: Some(TokenStandard::NonFungible), // Use imported enum
            }
        )
        // The signer array needs to include accounts that sign the CPI instruction itself,
        // PLUS any accounts that need to sign because they are being initialized (like new_core_asset_mint).
        // Anchor's CPI context usually handles passing the signers from the main instruction context.
        // However, the new_core_asset_mint MUST sign its own initialization.
        // How this is passed depends on the `CreateV1Cpi` implementation.
        // It might require passing signer seeds or directly signing the transaction.
        // For now, assume Anchor passes buyer, and new_core_asset_mint signs via client tx.
        .invoke_signed(&[&[&[]]])?; // Pass empty outer seeds if program doesn't sign, relies on client signers

        // --- If invoke_signed needs seeds for program-signed PDAs ---
        // .invoke_signed(signer_seeds)?;


        msg!("Metaplex Core NFT minted successfully!");

        // --- 3. Update Design State ---
        design.slots_purchased = current_purchase_number;
        msg!("Design state updated. Slots purchased: {}", design.slots_purchased);

        // --- 4. Emit Event ---
        let design_id_str = bs58::encode(&design.design_id_hash).into_string();
        emit!(NftSlotPurchased {
            design_id: design_id_str,
            buyer: buyer.key(),
            purchase_number: current_purchase_number,
            new_nft_mint: new_core_asset_mint_account_info.key(),
        });

        msg!("Slot #{} purchased by {}. New NFT: {}",
            current_purchase_number, buyer.key(), new_core_asset_mint_account_info.key());

        Ok(())
    }

    // --- Add other instructions as needed (e.g., update_design_price, withdraw_fees) ---
}

// === Account Struct Definitions ===

#[derive(Accounts)]
pub struct InitializePlatformConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 2 + 1, // Approx size
        seeds = [PLATFORM_CONFIG_SEED],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: Fee wallet address set by admin
    pub platform_fee_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(design_id_hash: [u8; 32], shared_metadata_uri: String)]
pub struct RegisterDesign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        // Adjusted space calculation slightly (depends on max URI length)
        space = 8 + 32 + 32 + (4 + 200) + 8 + 2 + 2 + 1 + 1,
        seeds = [DESIGN_STATE_SEED, creator.key().as_ref(), &design_id_hash],
        bump
    )]
    pub design_state: Account<'info, DesignState>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(design_id_hash: [u8; 32])]
pub struct PurchaseAndMintSlot<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [DESIGN_STATE_SEED, design_state.creator.as_ref(), &design_id_hash],
        bump = design_state.bump,
        constraint = design_state.creator == creator_account.key() @ CustomError::InvalidCreatorAccount
    )]
    pub design_state: Account<'info, DesignState>,

    /// CHECK: User A's (creator's) system account for receiving payment. Verified by constraint.
    #[account(mut)]
    pub creator_account: AccountInfo<'info>,

    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump // Anchor handles finding bump based on seeds
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: Platform's fee wallet. Verified by constraint.
    #[account(mut, address = platform_config.fee_wallet @ CustomError::InvalidPlatformFeeWallet)]
    pub platform_fee_wallet_account: AccountInfo<'info>,

    /// CHECK: Account for the new NFT. Must be a signer. Will be initialized by CPI.
    #[account(mut)]
    pub new_core_asset_mint: Signer<'info>,

    // Use Program<'info, MplCore> to make Anchor ensure the ID is correct
    // And potentially access program methods/constants if needed by the crate
    #[account(address = MplCoreProgramId @ CustomError::InvalidMplCoreProgram)]
    pub mpl_core_program: Program<'info, MplCore>, // Changed back to Program

    // System Program needed for SOL transfers and CPI account creation
    pub system_program: Program<'info, System>,
}


// === Custom Data Structs ===
#[account]
#[derive(Default, Debug, Copy)] // Added Copy for bump access if needed elsewhere, check if Default needed
pub struct PlatformConfig {
    pub admin: Pubkey,
    pub fee_wallet: Pubkey,
    pub fee_basis_points: u16,
    pub bump: u8,
}

#[account]
#[derive(Default, Debug)]
pub struct DesignState {
    pub creator: Pubkey,
    pub design_id_hash: [u8; 32],
    pub shared_metadata_uri: String, // Keep String, length check in instruction
    pub price_per_purchase_lamports: u64,
    pub total_slots: u16,
    pub slots_purchased: u16,
    pub is_initialized: bool,
    pub bump: u8,
}

// === Event ===
#[event]
pub struct NftSlotPurchased {
    pub design_id: String, // bs58 encoded hash
    pub buyer: Pubkey,
    pub purchase_number: u16,
    pub new_nft_mint: Pubkey,
}

// === Custom Errors ===
#[error_code]
pub enum CustomError {
    #[msg("This design is sold out.")]
    SoldOut, // 6000 0x1770
    #[msg("Total slots for a design cannot be zero.")]
    TotalSlotsCannotBeZero, // 6001 0x1771
    #[msg("Price cannot be zero.")]
    PriceCannotBeZero, // 6002 0x1772
    #[msg("The URI string is too long or empty.")]
    UriLengthInvalid, // 6003 0x1773
    #[msg("Design not initialized or not found for given ID/creator.")]
    DesignNotInitialized, // 6004 0x1774
    #[msg("The provided creator account does not match the design's creator.")]
    InvalidCreatorAccount, // 6005 0x1775
    #[msg("The provided platform fee wallet does not match the platform configuration.")]
    InvalidPlatformFeeWallet, // 6006 0x1776
    #[msg("An arithmetic error occurred (e.g., overflow/underflow).")]
    ArithmeticError, // 6007 0x1777
    #[msg("Invalid Metaplex Core program address provided.")]
    InvalidMplCoreProgram, // 6008 0x1778
    #[msg("Fee basis points cannot exceed 10000 (100%).")]
    FeeTooHigh, // 6009 0x1779
}

// === Metaplex Core Program ID Wrapper ===
#[derive(Clone)]
pub struct MplCore; // Needed for Program<'info, MplCore>
impl anchor_lang::Id for MplCore {
    fn id() -> Pubkey {
        MplCoreProgramId // Use the constant from mpl_core crate
    }
}