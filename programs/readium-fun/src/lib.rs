// programs/readium-fun/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("EZ1GQumWC4UwwQBGERwtnMNS6rJRprjP1HhGfhLC2utJ");

// --- Constants for Account Sizing ---
// For User Account
// Discriminator (8) + String length (4) + (Max Chars * UTF-8 bytes per char, e.g., 4 for safety) + Enum (1) + Pubkey (32)
const MAX_USER_NAME_LENGTH: usize = 50;
const USER_ACCOUNT_SPACE: usize = 8 + (4 + MAX_USER_NAME_LENGTH * 4) + 1 + 32;

// For Tale Account
// Discriminator (8) + String length (4) + (Max Chars * UTF-8 bytes per char) + Pubkey (32) + Bump (1)
const MAX_TALE_NAME_LENGTH: usize = 100;
const TALE_ACCOUNT_SPACE: usize = 8 + (4 + MAX_TALE_NAME_LENGTH * 4) + 32 + 1;

// For Episode Account
// Discriminator (8) + String length (4) + (Max Chars * UTF-8 bytes per char for name) + Pubkey (tale link) (32) + u32 (episode_number) (4) + Pubkey (candy_machine_id) (32) + Pubkey (authority) (32) + Bump (1)
const MAX_EPISODE_NAME_LENGTH: usize = 150;
const EPISODE_ACCOUNT_SPACE: usize = 8 + (4 + MAX_EPISODE_NAME_LENGTH * 4) + 32 + 4 + 32 + 32 + 1;

#[program]
pub mod readium_fun {
    use super::*; // Imports items from the outer scope (constants, structs, errors)

    // --- User CRUD Instructions ---

    /// Creates a new user account.
    pub fn create_user(ctx: Context<CreateUser>, name: String, user_type: UserType) -> Result<()> {
        if name.chars().count() > MAX_USER_NAME_LENGTH {
            return err!(ErrorCode::NameTooLong);
        }
        if name.is_empty() {
            return err!(ErrorCode::UserNameEmpty);
        }

        let user_account = &mut ctx.accounts.user_account;
        user_account.name = name;
        user_account.user_type = user_type;
        user_account.authority = *ctx.accounts.authority.key;
        
        msg!("User created: {}", user_account.name);
        Ok(())
    }

    /// Updates an existing user's information.
    pub fn update_user(ctx: Context<UpdateUser>, name: Option<String>, user_type: Option<UserType>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let mut changed = false;

        if let Some(new_name) = name {
            if new_name.chars().count() > MAX_USER_NAME_LENGTH {
                return err!(ErrorCode::NameTooLong);
            }
            if new_name.is_empty() {
                return err!(ErrorCode::UserNameEmpty);
            }
            if user_account.name != new_name {
                user_account.name = new_name;
                changed = true;
                msg!("User name updated for authority: {}", user_account.authority);
            }
        }

        if let Some(new_user_type) = user_type {
             if user_account.user_type != new_user_type {
                user_account.user_type = new_user_type;
                changed = true;
                msg!("User type updated for authority: {}", user_account.authority);
            }
        }
        
        if !changed {
            return err!(ErrorCode::NoFieldsToUpdate);
        }
        Ok(())
    }

    /// Deletes a user account and reclaims its rent.
    pub fn delete_user(_ctx: Context<DeleteUser>) -> Result<()> {
        msg!("User account for authority {} closed.", _ctx.accounts.authority.key());
        Ok(())
    }

    // --- Tale CRUD Instructions ---

    /// Creates a new tale PDA account.
    pub fn create_tale(ctx: Context<CreateTale>, tale_name: String) -> Result<()> {
        if tale_name.chars().count() > MAX_TALE_NAME_LENGTH {
            return err!(ErrorCode::TaleNameTooLong);
        }
        if tale_name.is_empty() {
            return err!(ErrorCode::TaleNameEmpty);
        }

        let tale_account = &mut ctx.accounts.tale_account;
        tale_account.name = tale_name; 
        tale_account.creator = *ctx.accounts.creator.key;
        // Corrected bump access: use the field name from ctx.bumps
        tale_account.bump = ctx.bumps.tale_account;

        msg!("Tale created: '{}' by {}", tale_account.name, tale_account.creator);
        Ok(())
    }

    /// Updates the name of an existing tale.
    pub fn update_tale_name(ctx: Context<UpdateTaleName>, new_name: String) -> Result<()> {
        if new_name.chars().count() > MAX_TALE_NAME_LENGTH {
            return err!(ErrorCode::TaleNameTooLong);
        }
        if new_name.is_empty() {
            return err!(ErrorCode::TaleNameEmpty);
        }

        let tale_account = &mut ctx.accounts.tale_account;
        if tale_account.name == new_name {
            return err!(ErrorCode::NoFieldsToUpdate); // Or allow, but log no change
        }
        msg!("Updating tale name from '{}' to '{}' for creator {}", tale_account.name, new_name, tale_account.creator);
        tale_account.name = new_name;
        
        Ok(())
    }

    /// Deletes a tale account and reclaims its rent.
    pub fn delete_tale(_ctx: Context<DeleteTale>) -> Result<()> {
        msg!("Tale account '{}' closed by creator: {}", _ctx.accounts.tale_account.name, _ctx.accounts.creator.key());
        Ok(())
    }

    // --- Episode CRUD Instructions ---

    /// Creates a new episode PDA account, linked to a tale.
    /// The authority to create an episode is the creator of the parent tale.
    pub fn create_episode(
        ctx: Context<CreateEpisode>,
        episode_name: String,
        episode_number: u32,
        candy_machine_id: Pubkey,
    ) -> Result<()> {
        // Validate episode name
        if episode_name.chars().count() > MAX_EPISODE_NAME_LENGTH {
            return err!(ErrorCode::EpisodeNameTooLong);
        }
        if episode_name.is_empty() {
            return err!(ErrorCode::EpisodeNameEmpty);
        }
        if episode_number == 0 { // Episode numbers should be positive
            return err!(ErrorCode::InvalidEpisodeNumber);
        }

        let episode_account = &mut ctx.accounts.episode_account;
        let tale_account = &ctx.accounts.tale; // Parent tale

        episode_account.name = episode_name;
        episode_account.tale = tale_account.key();
        episode_account.episode_number = episode_number;
        episode_account.candy_machine_id = candy_machine_id;
        episode_account.authority = tale_account.creator; // Authority is the tale's creator
        // Corrected bump access: use the field name from ctx.bumps
        episode_account.bump = ctx.bumps.episode_account;

        msg!(
            "Episode {} ('{}') for Tale '{}' created with Candy Machine ID: {}. Authority: {}",
            episode_account.episode_number,
            episode_account.name,
            tale_account.name, // Logging parent tale name for clarity
            episode_account.candy_machine_id,
            episode_account.authority
        );
        Ok(())
    }

    /// Updates an existing episode's name or candy machine ID.
    /// The episode_number and tale link are immutable as they are part of PDA seeds.
    /// Authority is the creator of the parent tale (stored in episode_account.authority).
    pub fn update_episode(
        ctx: Context<UpdateEpisode>,
        new_name: Option<String>,
        new_candy_machine_id: Option<Pubkey>,
    ) -> Result<()> {
        let episode_account = &mut ctx.accounts.episode_account;
        let mut changed = false; // Flag to track if any changes were made

        if let Some(name_val) = new_name {
            if name_val.chars().count() > MAX_EPISODE_NAME_LENGTH {
                return err!(ErrorCode::EpisodeNameTooLong);
            }
            if name_val.is_empty() {
                return err!(ErrorCode::EpisodeNameEmpty);
            }
            if episode_account.name != name_val {
                episode_account.name = name_val;
                changed = true;
                msg!("Episode name updated to: {}", episode_account.name);
            }
        }

        if let Some(cm_id_val) = new_candy_machine_id {
            if episode_account.candy_machine_id != cm_id_val {
                episode_account.candy_machine_id = cm_id_val;
                changed = true;
                msg!("Episode Candy Machine ID updated to: {}", episode_account.candy_machine_id);
            }
        }
        
        // If no effective changes were made, return an error or simply Ok(())
        if !changed {
             return err!(ErrorCode::NoFieldsToUpdate);
        }

        Ok(())
    }

    /// Deletes an episode account and reclaims its rent.
    /// Authority is the creator of the parent tale (stored in episode_account.authority).
    pub fn delete_episode(_ctx: Context<DeleteEpisode>) -> Result<()> {
        msg!(
            "Episode {} ('{}') for Tale '{}' deleted by authority: {}",
            _ctx.accounts.episode_account.episode_number,
            _ctx.accounts.episode_account.name,
            _ctx.accounts.episode_account.tale, // Logging parent tale key
            _ctx.accounts.authority.key()
        );
        Ok(())
    }

    // --- Add other instructions as needed (e.g., update_design_price, withdraw_fees) ---
}

// --- User Account Definitions ---

/// Represents a user account.
#[account]
pub struct User {
    pub name: String,
    pub user_type: UserType,
    pub authority: Pubkey,
}

/// Defines the types of users.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum UserType {
    Admin,
    Member,
    Guest,
}

/// Accounts context for creating a user.
#[derive(Accounts)]
#[instruction(name: String, user_type: UserType)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = authority,
        space = USER_ACCOUNT_SPACE,
    )]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Accounts context for updating a user.
#[derive(Accounts)]
#[instruction(name: Option<String>, user_type: Option<UserType>)]
pub struct UpdateUser<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub user_account: Account<'info, User>,
    pub authority: Signer<'info>,
}

/// Accounts context for deleting a user.
#[derive(Accounts)]
pub struct DeleteUser<'info> {
    #[account(
        mut,
        has_one = authority,
        close = authority
    )]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
}


// --- Tale Account Definitions ---

/// Represents a tale account, which is a Program Derived Address (PDA).
#[account]
pub struct Tale {
    pub name: String,
    pub creator: Pubkey, // This field is used in has_one constraint for CreateEpisode
    pub bump: u8,
}

/// Accounts context for creating a tale.
#[derive(Accounts)]
#[instruction(tale_name: String)]
pub struct CreateTale<'info> {
    #[account(
        init,
        payer = creator,
        space = TALE_ACCOUNT_SPACE,
        seeds = [b"tale", creator.key().as_ref(), tale_name.as_bytes()], 
        bump // Anchor will automatically add a field `tale_account_bump: u8` to CreateTaleBumps
    )]
    pub tale_account: Account<'info, Tale>, // Field name used for bump: ctx.bumps.tale_account
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Accounts context for updating a tale's name.
#[derive(Accounts)]
#[instruction(new_name: String)]
pub struct UpdateTaleName<'info> {
    #[account(
        mut,
        has_one = creator, 
        seeds = [b"tale", creator.key().as_ref(), tale_account.name.as_bytes()], 
        bump = tale_account.bump
    )]
    pub tale_account: Account<'info, Tale>,
    pub creator: Signer<'info>, 
}

/// Accounts context for deleting a tale.
#[derive(Accounts)]
pub struct DeleteTale<'info> {
    #[account(
        mut,
        has_one = creator, 
        close = creator,   
        seeds = [b"tale", creator.key().as_ref(), tale_account.name.as_bytes()], 
        bump = tale_account.bump
    )]
    pub tale_account: Account<'info, Tale>,
    #[account(mut)] 
    pub creator: Signer<'info>,
}

// --- Episode Account Definitions ---

/// Represents an episode account, linked to a Tale. PDA.
#[account]
pub struct Episode {
    /// Name of the episode.
    pub name: String,
    /// Public key of the parent Tale account.
    pub tale: Pubkey,
    /// Sequential number of the episode within its tale (e.g., 1, 2, 3...). Used in PDA seeds.
    pub episode_number: u32,
    /// Public key of the associated Candy Machine.
    pub candy_machine_id: Pubkey,
    /// Authority that can manage this episode (creator of the parent Tale).
    pub authority: Pubkey,
    /// Bump seed for PDA derivation.
    pub bump: u8,
}

/// Accounts context for creating an episode.
#[derive(Accounts)]
#[instruction(episode_name: String, episode_number: u32, candy_machine_id: Pubkey)]
pub struct CreateEpisode<'info> {
    /// The new episode PDA account to be initialized.
    /// Seeds: "episode", parent tale's key, episode number.
    #[account(
        init,
        payer = creator, // Corrected: Payer is the creator (Signer)
        space = EPISODE_ACCOUNT_SPACE,
        seeds = [
            b"episode",
            tale.key().as_ref(), // Parent tale's key
            episode_number.to_le_bytes().as_ref() // Episode number as bytes
        ],
        bump // Anchor will automatically add a field `episode_account_bump: u8` to CreateEpisodeBumps
    )]
    pub episode_account: Account<'info, Episode>, // Field name used for bump: ctx.bumps.episode_account

    /// The parent Tale account this episode belongs to.
    /// Used to derive PDA, get creator as authority.
    /// Corrected: `has_one = creator` refers to the `creator` Signer below.
    #[account(
        has_one = creator @ ErrorCode::InvalidTaleAuthority
    )]
    pub tale: Account<'info, Tale>,

    /// The signer creating the episode. Must be the creator of the parent Tale.
    /// Corrected: Renamed from signer_authority to creator for consistency with `has_one`.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The Solana system program.
    pub system_program: Program<'info, System>,
}

/// Accounts context for updating an episode.
#[derive(Accounts)]
#[instruction(new_name: Option<String>, new_candy_machine_id: Option<Pubkey>)]
pub struct UpdateEpisode<'info> {
    /// The episode account to be updated.
    /// `has_one = authority` ensures that the `authority` field in the `Episode` account
    /// (which is the tale's creator) matches the signer.
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidEpisodeAuthority, // `authority` is the field in Episode struct
        seeds = [
            b"episode",
            episode_account.tale.as_ref(), // Parent tale's key from the episode account
            episode_account.episode_number.to_le_bytes().as_ref()
        ],
        bump = episode_account.bump
    )]
    pub episode_account: Account<'info, Episode>,

    /// The signer (authority) performing the update. Must match `episode_account.authority`.
    pub authority: Signer<'info>,
}

/// Accounts context for deleting an episode.
#[derive(Accounts)]
pub struct DeleteEpisode<'info> {
    /// The episode account to be closed.
    /// `has_one = authority` ensures the signer matches `episode_account.authority`.
    /// `close = authority` transfers rent back to this authority.
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidEpisodeAuthority, // `authority` is the field in Episode struct
        close = authority,
        seeds = [
            b"episode",
            episode_account.tale.as_ref(), // Parent tale's key from the episode account
            episode_account.episode_number.to_le_bytes().as_ref()
        ],
        bump = episode_account.bump
    )]
    pub episode_account: Account<'info, Episode>,

    /// The signer (authority) performing the deletion. Must match `episode_account.authority`.
    #[account(mut)] // Authority needs to be mutable to receive closed account funds
    pub authority: Signer<'info>,
}


// --- Custom Error Codes ---
#[error_code]
pub enum ErrorCode {
    #[msg("The provided user name is too long.")]
    NameTooLong,
    #[msg("The user name cannot be empty.")]
    UserNameEmpty,
    #[msg("The provided tale name is too long.")]
    TaleNameTooLong,
    #[msg("The tale name cannot be empty.")]
    TaleNameEmpty,
    #[msg("Could not retrieve bump seed. Ensure 'bump' is used in PDA account constraints.")]
    BumpError, // This might become less relevant with direct bump access if .ok_or is removed
    #[msg("The provided episode name is too long.")]
    EpisodeNameTooLong,
    #[msg("The episode name cannot be empty.")]
    EpisodeNameEmpty,
    #[msg("Episode number must be greater than zero.")]
    InvalidEpisodeNumber,
    #[msg("The signer is not the authorized creator of the tale.")]
    InvalidTaleAuthority,
    #[msg("The signer is not the authorized authority for this episode.")]
    InvalidEpisodeAuthority,
    #[msg("No fields provided to update or values are the same.")]
    NoFieldsToUpdate,
}