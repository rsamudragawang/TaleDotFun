use anchor_lang::prelude::*;

// Program ID from your provided IDL
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
    #[msg("Cannot delete a published tale directly. Set to archived first.")]
    CannotDeletePublished,

    #[msg("Episode ID (seed) is too long.")]
    EpisodeIdSeedTooLong,
    #[msg("Episode name is too long.")]
    EpisodeNameTooLong,
    #[msg("Image Set ID is too long.")]
    ImageSetIdTooLong,
    #[msg("Candy Machine ID is too long.")]
    CandyMachineIdTooLong,
}

// --- Constants for String Lengths ---
// Tale constants
const MAX_TALE_ID_LENGTH: usize = 32;
const MAX_TITLE_LENGTH: usize = 100;
const MAX_TALE_CONTENT_CID_LENGTH: usize = 64;
const MAX_GENRE_LENGTH: usize = 30;
const MAX_COVER_IMAGE_CID_LENGTH: usize = 64;

// Episode constants
const MAX_EPISODE_ID_SEED_LENGTH: usize = 32;
const MAX_EPISODE_NAME_LENGTH: usize = 100;
const MAX_EPISODE_CONTENT_CID_LENGTH: usize = 64;
const MAX_IMAGE_SET_ID_LENGTH: usize = 30; // MongoDB ObjectId string is 24 chars
const MAX_CANDY_MACHINE_ID_LENGTH: usize = 44; // Solana pubkey base58

// --- Account Struct Definitions ---
#[account]
pub struct Tale {
    pub author: Pubkey,
    pub tale_id: String,
    pub title: String,
    pub content_cid: String,
    pub genre: String,
    pub cover_image_cid: String,
    pub status: u8,
    pub timestamp: i64,
    pub bump: u8,
}
// Space for Tale: 8 (disc) + 32 (author) + (4+MAX_TALE_ID_LENGTH) + (4+MAX_TITLE_LENGTH) + (4+MAX_TALE_CONTENT_CID_LENGTH) + (4+MAX_GENRE_LENGTH) + (4+MAX_COVER_IMAGE_CID_LENGTH) + 1 (status) + 8 (timestamp) + 1 (bump) + 32 (buffer for future growth)
const TALE_ACCOUNT_SPACE: usize = 8 + 32 + (4+32) + (4+100) + (4+64) + (4+30) + (4+64) + 1 + 8 + 1 + 32; // Approx 380, rounded to 450 in previous example, let's keep it roomy.

#[account]
pub struct Episode {
    pub author: Pubkey,
    pub parent_tale: Pubkey,
    pub episode_id_seed: String,
    pub episode_name: String,
    pub content_cid: String,
    pub image_set_id: String,
    pub order: u32,
    pub status: u8,
    pub is_nft: bool,
    pub candy_machine_id: String,
    pub timestamp: i64,
    pub bump: u8,
}
// Space for Episode: 8(disc) + 32(author) + 32(parent_tale) + (4+MAX_EPISODE_ID_SEED_LENGTH) + (4+MAX_EPISODE_NAME_LENGTH) + (4+MAX_EPISODE_CONTENT_CID_LENGTH) + (4+MAX_IMAGE_SET_ID_LENGTH) + 4(order) + 1(status) + 1(is_nft) + (4+MAX_CANDY_MACHINE_ID_LENGTH) + 8(timestamp) + 1(bump) + 32(buffer)
const EPISODE_ACCOUNT_SPACE: usize = 8 + 32 + 32 + (4+32) + (4+100) + (4+64) + (4+30) + 4 + 1 + 1 + (4+44) + 8 + 1 + 32; // Approx 400, using 480 from previous example.

// --- Enums for Status ---
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum TaleStatus { Draft = 0, Published = 1, Archived = 2 }

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum EpisodeStatus { Draft = 0, Published = 1, Archived = 2 }

#[program]
pub mod tale_story { // Module name from your IDL
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
        if tale_id.len() > MAX_TALE_ID_LENGTH { return err!(AppError::EpisodeIdSeedTooLong); } // Corrected error name if it was generic
        if title.len() > MAX_TITLE_LENGTH { return err!(AppError::TitleTooLong); }
        if content_cid.len() > MAX_TALE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
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
        if new_content_cid.len() > MAX_TALE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if new_genre.len() > MAX_GENRE_LENGTH { return err!(AppError::GenreTooLong); }
        if new_cover_image_cid.len() > MAX_COVER_IMAGE_CID_LENGTH { return err!(AppError::CoverImageCidTooLong); }
        if new_status > TaleStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let tale = &mut ctx.accounts.tale_account;
        // Auth handled by has_one constraint

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
        // Auth handled by has_one constraint
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
        image_set_id: String,
        order: u32,
        initial_status: u8,
        is_nft: bool,
        candy_machine_id: String,
    ) -> Result<()> {
        if episode_id_seed.len() > MAX_EPISODE_ID_SEED_LENGTH { return err!(AppError::EpisodeIdSeedTooLong); }
        if episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if content_cid.len() > MAX_EPISODE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if image_set_id.len() > MAX_IMAGE_SET_ID_LENGTH { return err!(AppError::ImageSetIdTooLong); }
        if candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if initial_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let episode = &mut ctx.accounts.episode_account;
        let tale_account = &ctx.accounts.parent_tale_account;

        episode.author = *ctx.accounts.author.key;
        episode.parent_tale = tale_account.key();
        episode.episode_id_seed = episode_id_seed;
        episode.episode_name = episode_name;
        episode.content_cid = content_cid;
        episode.image_set_id = image_set_id;
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
        new_image_set_id: String,
        new_order: u32,
        new_status: u8,
        new_is_nft: bool,
        new_candy_machine_id: String,
    ) -> Result<()> {
        if new_episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if new_content_cid.len() > MAX_EPISODE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if new_image_set_id.len() > MAX_IMAGE_SET_ID_LENGTH { return err!(AppError::ImageSetIdTooLong); }
        if new_candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if new_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let episode = &mut ctx.accounts.episode_account;
        // Auth handled by has_one constraint

        episode.episode_name = new_episode_name;
        episode.content_cid = new_content_cid;
        episode.image_set_id = new_image_set_id;
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
        // Auth handled by has_one constraint
        msg!("Episode deleted: {}", episode.episode_name);
        Ok(())
    }
}

// --- Contexts ---
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
    pub tale_account: Account<'info, Tale>,
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
    pub tale_account: Account<'info, Tale>,
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
    pub tale_account: Account<'info, Tale>,
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
    pub episode_account: Account<'info, Episode>,
    #[account(
        constraint = parent_tale_account.author == author.key() @ AppError::Unauthorized
    )]
    pub parent_tale_account: Account<'info, Tale>,
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
            episode_account.parent_tale.as_ref(), // Use stored parent_tale pubkey
            episode_account.episode_id_seed.as_bytes()
        ],
        bump = episode_account.bump,
        has_one = author
    )]
    pub episode_account: Account<'info, Episode>,
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
    pub episode_account: Account<'info, Episode>,
    #[account(mut)]
    pub author: Signer<'info>,
}
