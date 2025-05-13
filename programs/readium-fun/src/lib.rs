// programs/readium-fun/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("EynuKneQ6RX5AAUY8E6Lq6WvNrUVY2F3C8TcFNB7MYh8");
// --- Errors ---
#[error_code]
pub enum AppError {
    #[msg("Title is too long.")]
    TitleTooLong,
    #[msg("Content CID is too long.")]
    ContentCidTooLong,
    #[msg("Genre is too long.")]
    GenreTooLong,
    #[msg("Cover image CID is too long.")]
    CoverImageCidTooLong,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Invalid status value.")]
    InvalidStatus,
    #[msg("Tale is already published and cannot be modified in this way.")]
    TalePublished,
    #[msg("Cannot delete a published tale directly. Set to archived first.")]
    CannotDeletePublished,

    #[msg("Episode ID is too long.")]
    EpisodeIdTooLong,
    #[msg("Episode name is too long.")]
    EpisodeNameTooLong,
    #[msg("Candy Machine ID is too long.")]
    CandyMachineIdTooLong,
    #[msg("Episode is NFT linked and cannot be modified in this way.")]
    EpisodeNftLocked,
    #[msg("Parent tale account does not match.")]
    ParentTaleMismatch,
}

// --- Constants for String Lengths ---
// Tale constants
const MAX_TALE_ID_LENGTH: usize = 32; // Max length for the string seed
const MAX_TITLE_LENGTH: usize = 100;
const MAX_CONTENT_CID_LENGTH: usize = 64;
const MAX_GENRE_LENGTH: usize = 30;
const MAX_COVER_IMAGE_CID_LENGTH: usize = 64;

// Episode constants
const MAX_EPISODE_ID_LENGTH: usize = 32; // Max length for the string seed
const MAX_EPISODE_NAME_LENGTH: usize = 100;
// content_cid for episode can reuse MAX_CONTENT_CID_LENGTH
const MAX_CANDY_MACHINE_ID_LENGTH: usize = 64; // Solana pubkeys (base58) are ~44 chars

// --- Account Struct Definitions (MOVED UP) ---
#[account]
pub struct Tale {
    pub author: Pubkey,
    pub tale_id: String, // Max MAX_TALE_ID_LENGTH (e.g., 32)
    pub title: String,   // Max MAX_TITLE_LENGTH
    pub content_cid: String, // Max MAX_CONTENT_CID_LENGTH
    pub genre: String,   // Max MAX_GENRE_LENGTH
    pub cover_image_cid: String, // Max MAX_COVER_IMAGE_CID_LENGTH
    pub status: u8,
    pub timestamp: i64,
    pub bump: u8,
}

// Space for Tale: 8 (disc) + 32 (author) + (4+32) (tale_id) + (4+100) (title) + (4+64) (content_cid) + (4+30) (genre) + (4+64) (cover_image_cid) + 1 (status) + 8 (timestamp) + 1 (bump) + ~32 (buffer) = ~384 bytes. Let's use 450.
const TALE_ACCOUNT_SPACE: usize = 450;

#[account]
pub struct Episode {
    pub author: Pubkey,         // Author of the parent tale, for auth checks. 32 bytes.
    pub parent_tale: Pubkey,    // Pubkey of the Tale account this episode belongs to. 32 bytes.
    pub episode_id_seed: String, // Max MAX_EPISODE_ID_LENGTH (e.g. 32 bytes for seed)
    pub episode_name: String,   // Max MAX_EPISODE_NAME_LENGTH
    pub content_cid: String,    // IPFS CID for the episode's main content. Max MAX_CONTENT_CID_LENGTH
    pub order: u32,             // Order of the episode within the tale. 4 bytes.
    pub status: u8,             // Draft, Published, Archived. 1 byte.
    pub is_nft: bool,           // Is this episode linked to an NFT? 1 byte.
    pub candy_machine_id: String, // Optional. Max MAX_CANDY_MACHINE_ID_LENGTH
    pub timestamp: i64,         // 8 bytes
    pub bump: u8,               // 1 byte
}
// Space for Episode: 8 (disc) + 32 (author) + 32 (parent_tale) + (4+32) (episode_id_seed) + (4+100) (name) + (4+64) (content_cid) + 4 (order) + 1 (status) + 1 (is_nft) + (4+64) (cm_id) + 8 (timestamp) + 1 (bump) + ~32 (buffer) = ~400 bytes. Let's use 480.
const EPISODE_ACCOUNT_SPACE: usize = 480;

// --- Enums for Status (MOVED UP IF USED AS TYPES IN STRUCTS, good practice to define early) ---
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)] // Added Debug
pub enum TaleStatus {
    Draft = 0,
    Published = 1,
    Archived = 2,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)] // Added Debug
pub enum EpisodeStatus {
    Draft = 0,
    Published = 1,
    Archived = 2,
}


#[program]
pub mod readium_fun {
    use super::*;

    // --- Tale Instructions ---
    pub fn create_tale(
        ctx: Context<CreateTale>,
        tale_id: String,
        title: String,
        content_cid: String,
        genre: String,
        cover_image_cid: String,
        initial_status: u8,
    ) -> Result<()> {
        if tale_id.len() > MAX_TALE_ID_LENGTH { return err!(AppError::EpisodeIdTooLong); }
        if title.len() > MAX_TITLE_LENGTH { return err!(AppError::TitleTooLong); }
        if content_cid.len() > MAX_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if genre.len() > MAX_GENRE_LENGTH { return err!(AppError::GenreTooLong); }
        if cover_image_cid.len() > MAX_COVER_IMAGE_CID_LENGTH { return err!(AppError::CoverImageCidTooLong); }
        if initial_status > TaleStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let tale = &mut ctx.accounts.tale_account;
        tale.author = *ctx.accounts.author.key;
        tale.tale_id = tale_id;
        tale.title = title;
        tale.content_cid = content_cid;
        tale.genre = genre;
        tale.cover_image_cid = cover_image_cid;
        tale.status = initial_status;
        tale.timestamp = Clock::get()?.unix_timestamp;
        tale.bump = ctx.bumps.tale_account;

        msg!("Tale created: {} by {}", tale.title, tale.author);
        Ok(())
    }

    pub fn update_tale(
        ctx: Context<UpdateTale>,
        new_title: String,
        new_content_cid: String,
        new_genre: String,
        new_cover_image_cid: String,
        new_status: u8,
    ) -> Result<()> {
        if new_title.len() > MAX_TITLE_LENGTH { return err!(AppError::TitleTooLong); }
        if new_content_cid.len() > MAX_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if new_genre.len() > MAX_GENRE_LENGTH { return err!(AppError::GenreTooLong); }
        if new_cover_image_cid.len() > MAX_COVER_IMAGE_CID_LENGTH { return err!(AppError::CoverImageCidTooLong); }
        if new_status > TaleStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let tale = &mut ctx.accounts.tale_account;

        tale.title = new_title;
        tale.content_cid = new_content_cid;
        tale.genre = new_genre;
        tale.cover_image_cid = new_cover_image_cid;
        tale.status = new_status;
        tale.timestamp = Clock::get()?.unix_timestamp;

        msg!("Tale updated: {}", tale.title);
        Ok(())
    }

    pub fn delete_tale(ctx: Context<DeleteTale>) -> Result<()> {
        let tale = &ctx.accounts.tale_account;
        if tale.status == TaleStatus::Published as u8 {
            return err!(AppError::CannotDeletePublished);
        }
        msg!("Tale deleted: {}", tale.title);
        Ok(())
    }

    // --- Episode Instructions ---
    pub fn create_episode(
        ctx: Context<CreateEpisode>,
        episode_id_seed: String,
        episode_name: String,
        content_cid: String,
        order: u32,
        initial_status: u8,
        is_nft: bool,
        candy_machine_id: String,
    ) -> Result<()> {
        if episode_id_seed.len() > MAX_EPISODE_ID_LENGTH { return err!(AppError::EpisodeIdTooLong); }
        if episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if content_cid.len() > MAX_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if initial_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let episode = &mut ctx.accounts.episode_account;
        let tale_account = &ctx.accounts.parent_tale_account;

        episode.author = *ctx.accounts.author.key;
        episode.parent_tale = tale_account.key();
        episode.episode_id_seed = episode_id_seed;
        episode.episode_name = episode_name;
        episode.content_cid = content_cid;
        episode.order = order;
        episode.status = initial_status;
        episode.is_nft = is_nft;
        episode.candy_machine_id = if is_nft { candy_machine_id } else { "".to_string() };
        episode.timestamp = Clock::get()?.unix_timestamp;
        episode.bump = ctx.bumps.episode_account;

        msg!("Episode created: '{}' for tale '{}'", episode.episode_name, tale_account.title);
        Ok(())
    }

    pub fn update_episode(
        ctx: Context<UpdateEpisode>,
        new_episode_name: String,
        new_content_cid: String,
        new_order: u32,
        new_status: u8,
        new_is_nft: bool,
        new_candy_machine_id: String,
    ) -> Result<()> {
        if new_episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if new_content_cid.len() > MAX_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if new_candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if new_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let episode = &mut ctx.accounts.episode_account;

        episode.episode_name = new_episode_name;
        episode.content_cid = new_content_cid;
        episode.order = new_order;
        episode.status = new_status;
        episode.is_nft = new_is_nft;
        episode.candy_machine_id = if new_is_nft { new_candy_machine_id } else { "".to_string() };
        episode.timestamp = Clock::get()?.unix_timestamp;

        msg!("Episode updated: {}", episode.episode_name);
        Ok(())
    }

    pub fn delete_episode(ctx: Context<DeleteEpisode>) -> Result<()> {
        let episode = &ctx.accounts.episode_account;
        msg!("Episode deleted: {}", episode.episode_name);
        Ok(())
    }
}

// --- Contexts (Now defined AFTER Account Structs) ---
// Tale Contexts
#[derive(Accounts)]
#[instruction(tale_id: String)]
pub struct CreateTale<'info> {
    #[account(
        init,
        payer = author,
        space = TALE_ACCOUNT_SPACE,
        seeds = [b"tale", tale_id.as_bytes()],
        bump
    )]
    pub tale_account: Account<'info, Tale>, // Now Tale is a known type
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTale<'info> {
    #[account(
        mut,
        seeds = [b"tale", tale_account.tale_id.as_bytes()],
        bump = tale_account.bump,
        has_one = author
    )]
    pub tale_account: Account<'info, Tale>, // Now Tale is a known type
    #[account(mut)]
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteTale<'info> {
    #[account(
        mut,
        seeds = [b"tale", tale_account.tale_id.as_bytes()],
        bump = tale_account.bump,
        has_one = author,
        close = author
    )]
    pub tale_account: Account<'info, Tale>, // Now Tale is a known type
    #[account(mut)]
    pub author: Signer<'info>,
}

// Episode Contexts
#[derive(Accounts)]
#[instruction(episode_id_seed: String)]
pub struct CreateEpisode<'info> {
    #[account(
        init,
        payer = author,
        space = EPISODE_ACCOUNT_SPACE,
        seeds = [
            b"episode".as_ref(),
            parent_tale_account.key().as_ref(),
            episode_id_seed.as_bytes()
        ],
        bump
    )]
    pub episode_account: Account<'info, Episode>, // Now Episode is a known type

    #[account(
        constraint = parent_tale_account.author == author.key() @ AppError::Unauthorized
    )]
    pub parent_tale_account: Account<'info, Tale>, // Now Tale is a known type

    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateEpisode<'info> {
    #[account(
        mut,
        seeds = [
            b"episode".as_ref(),
            episode_account.parent_tale.as_ref(),
            episode_account.episode_id_seed.as_bytes()
        ],
        bump = episode_account.bump,
        has_one = author
    )]
    pub episode_account: Account<'info, Episode>, // Now Episode is a known type

    #[account(mut)]
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteEpisode<'info> {
    #[account(
        mut,
        seeds = [
            b"episode".as_ref(),
            episode_account.parent_tale.as_ref(),
            episode_account.episode_id_seed.as_bytes()
        ],
        bump = episode_account.bump,
        has_one = author,
        close = author
    )]
    pub episode_account: Account<'info, Episode>, // Now Episode is a known type
    #[account(mut)]
    pub author: Signer<'info>,
}
