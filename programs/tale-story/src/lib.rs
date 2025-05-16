use anchor_lang::prelude::*;

// Program ID from your provided IDL
declare_id!("FuHt8d5LN4fr2KrT9N4cb4WSsLBsm5aXgHUkEEGzxSU9");

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
    #[msg("Thumbnail CID is too long.")]
    ThumbnailCidTooLong,
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
    #[msg("Episode Thumbnail CID is too long.")]
    EpisodeThumbnailCidTooLong,
    #[msg("Candy Machine ID is too long.")]
    CandyMachineIdTooLong,
    #[msg("Invalid schedule times: Publish time must be before unpublish time if both are set.")]
    InvalidScheduleTimes,
    #[msg("Like count overflow.")]
    LikeCountOverflow,
}

// --- Constants for String Lengths ---
const MAX_TALE_ID_LENGTH: usize = 32;
const MAX_TITLE_LENGTH: usize = 100;
const MAX_TALE_CONTENT_CID_LENGTH: usize = 90; // Increased from 64
const MAX_GENRE_LENGTH: usize = 30;
const MAX_COVER_IMAGE_CID_LENGTH: usize = 64;
const MAX_THUMBNAIL_CID_LENGTH: usize = 64;

const MAX_EPISODE_ID_SEED_LENGTH: usize = 32;
const MAX_EPISODE_NAME_LENGTH: usize = 100;
const MAX_EPISODE_CONTENT_CID_LENGTH: usize = 64; // Episode content CID can remain 64 if desired
const MAX_EPISODE_THUMBNAIL_CID_LENGTH: usize = 64;
const MAX_IMAGE_SET_ID_LENGTH: usize = 30;
const MAX_CANDY_MACHINE_ID_LENGTH: usize = 44;

// --- Account Struct Definitions ---
#[account]
pub struct Tale {
    pub author: Pubkey,
    pub tale_id: String,
    pub title: String,
    pub content_cid: String, // Max length defined by MAX_TALE_CONTENT_CID_LENGTH
    pub genre: String,
    pub cover_image_cid: String,
    pub thumbnail_cid: String,
    pub status: u8,
    pub timestamp: i64,
    pub bump: u8,
    pub candy_machine_address: Option<Pubkey>,
    pub is_governance_token_gated: bool,
    pub is_early_access_token_gated: bool,
    pub is_real_world_asset_gated: bool,
    pub like_count: u64,
}

// Recalculated Space for Tale:
// Discriminator: 8
// author: 32
// tale_id: 4 + MAX_TALE_ID_LENGTH (32) = 36
// title: 4 + MAX_TITLE_LENGTH (100) = 104
// content_cid: 4 + MAX_TALE_CONTENT_CID_LENGTH (90) = 94  <-- Changed
// genre: 4 + MAX_GENRE_LENGTH (30) = 34
// cover_image_cid: 4 + MAX_COVER_IMAGE_CID_LENGTH (64) = 68
// thumbnail_cid: 4 + MAX_THUMBNAIL_CID_LENGTH (64) = 68
// status: 1
// timestamp: 8
// bump: 1
// candy_machine_address: 1 (Option) + 32 (Pubkey) = 33
// is_governance_token_gated: 1
// is_early_access_token_gated: 1
// is_real_world_asset_gated: 1
// like_count: 8
// Sum of fields = 8+32+36+104+94+34+68+68+1+8+1+33+1+1+1+8 = 490 bytes
// Buffer: Let's use 38 to make it 528 (divisible by 8)
const TALE_ACCOUNT_SPACE: usize = 490 + 38 + 8; // Total 536 bytes (add 8 for u64 like_count)

#[account]
pub struct Episode {
    pub author: Pubkey,
    pub parent_tale: Pubkey,
    pub episode_id_seed: String,
    pub episode_name: String,
    pub content_cid: String,
    pub thumbnail_cid: String,
    pub image_set_id: String,
    pub order: u32,
    pub status: u8,
    pub is_nft: bool,
    pub candy_machine_id: String,
    pub timestamp: i64,
    pub bump: u8,
    pub publish_at_time: Option<i64>,
    pub unpublish_at_time: Option<i64>,
    pub like_count: u64,
}

const EPISODE_ACCOUNT_SPACE: usize = 503 + 25; // Total 528 bytes

// --- Enums for Status ---
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum TaleStatus { Draft = 0, Published = 1, Archived = 2 }

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum EpisodeStatus {
    Draft = 0,
    Published = 1,
    Scheduled = 2,
    Archived = 3,
}

#[program]
pub mod tale_story {
    use super::*;

    pub fn create_tale(
        ctx: Context<CreateTale>,
        tale_id: String,
        title: String,
        content_cid: String, // This argument will be checked against MAX_TALE_CONTENT_CID_LENGTH
        genre: String,
        cover_image_cid: String,
        thumbnail_cid: String,
        initial_status: u8,
        candy_machine_address_option: Option<Pubkey>,
        is_governance: bool,
        is_early_access: bool,
        is_real_world: bool,
    ) -> Result<()> {
        if tale_id.len() > MAX_TALE_ID_LENGTH { return err!(AppError::EpisodeIdSeedTooLong); }
        if title.len() > MAX_TITLE_LENGTH { return err!(AppError::TitleTooLong); }
        if content_cid.len() > MAX_TALE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); } // Error originates here
        if genre.len() > MAX_GENRE_LENGTH { return err!(AppError::GenreTooLong); }
        if cover_image_cid.len() > MAX_COVER_IMAGE_CID_LENGTH { return err!(AppError::CoverImageCidTooLong); }
        if thumbnail_cid.len() > MAX_THUMBNAIL_CID_LENGTH { return err!(AppError::ThumbnailCidTooLong); }
        if initial_status > TaleStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let tale = &mut ctx.accounts.tale_account;
        tale.author = *ctx.accounts.author.key;
        tale.tale_id = tale_id;
        tale.title = title;
        tale.content_cid = content_cid;
        tale.genre = genre;
        tale.cover_image_cid = cover_image_cid;
        tale.thumbnail_cid = thumbnail_cid;
        tale.status = initial_status;
        tale.timestamp = Clock::get()?.unix_timestamp;
        tale.bump = ctx.bumps.tale_account;
        tale.candy_machine_address = candy_machine_address_option;
        tale.is_governance_token_gated = is_governance;
        tale.is_early_access_token_gated = is_early_access;
        tale.is_real_world_asset_gated = is_real_world;
        tale.like_count = 0;
        msg!("Tale created: {}, Content CID: {}, Thumbnail: {}", tale.title, tale.content_cid, tale.thumbnail_cid);
        Ok(())
    }

    pub fn update_tale(
        ctx: Context<UpdateTale>,
        new_title: String,
        new_content_cid: String, // This argument will be checked
        new_genre: String,
        new_cover_image_cid: String,
        new_thumbnail_cid: String,
        new_status: u8,
        new_candy_machine_address_option: Option<Pubkey>,
        new_is_governance: bool,
        new_is_early_access: bool,
        new_is_real_world: bool,
    ) -> Result<()> {
        if new_title.len() > MAX_TITLE_LENGTH { return err!(AppError::TitleTooLong); }
        if new_content_cid.len() > MAX_TALE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); } // Error could also originate here
        if new_genre.len() > MAX_GENRE_LENGTH { return err!(AppError::GenreTooLong); }
        if new_cover_image_cid.len() > MAX_COVER_IMAGE_CID_LENGTH { return err!(AppError::CoverImageCidTooLong); }
        if new_thumbnail_cid.len() > MAX_THUMBNAIL_CID_LENGTH { return err!(AppError::ThumbnailCidTooLong); }
        if new_status > TaleStatus::Archived as u8 { return err!(AppError::InvalidStatus); }

        let tale = &mut ctx.accounts.tale_account;
        tale.title = new_title;
        tale.content_cid = new_content_cid;
        tale.genre = new_genre;
        tale.cover_image_cid = new_cover_image_cid;
        tale.thumbnail_cid = new_thumbnail_cid;
        tale.status = new_status;
        tale.timestamp = Clock::get()?.unix_timestamp;
        tale.candy_machine_address = new_candy_machine_address_option;
        tale.is_governance_token_gated = new_is_governance;
        tale.is_early_access_token_gated = new_is_early_access;
        tale.is_real_world_asset_gated = new_is_real_world;
        msg!("Tale updated: {}, Content CID: {}, Thumbnail: {}", tale.title, tale.content_cid, tale.thumbnail_cid);
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
    // (These remain unchanged from the previous version that included episode scheduling, thumbnail, and likes)
    pub fn create_episode(
        ctx: Context<CreateEpisode>,
        episode_id_seed: String,
        episode_name: String,
        content_cid: String,
        thumbnail_cid: String,
        image_set_id: String,
        order: u32,
        initial_status: u8,
        is_nft: bool,
        candy_machine_id: String,
        publish_at_time_option: Option<i64>,
        unpublish_at_time_option: Option<i64>,
    ) -> Result<()> {
        if episode_id_seed.len() > MAX_EPISODE_ID_SEED_LENGTH { return err!(AppError::EpisodeIdSeedTooLong); }
        if episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if content_cid.len() > MAX_EPISODE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); } // Note: Episode content CID length
        if thumbnail_cid.len() > MAX_EPISODE_THUMBNAIL_CID_LENGTH { return err!(AppError::EpisodeThumbnailCidTooLong); }
        if image_set_id.len() > MAX_IMAGE_SET_ID_LENGTH { return err!(AppError::ImageSetIdTooLong); }
        if candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if initial_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }
        if let (Some(publish_ts), Some(unpublish_ts)) = (publish_at_time_option, unpublish_at_time_option) {
            if publish_ts >= unpublish_ts {
                return err!(AppError::InvalidScheduleTimes);
            }
        }

        let episode = &mut ctx.accounts.episode_account;
        let tale_account = &ctx.accounts.parent_tale_account;
        episode.author = *ctx.accounts.author.key;
        episode.parent_tale = tale_account.key();
        episode.episode_id_seed = episode_id_seed;
        episode.episode_name = episode_name;
        episode.content_cid = content_cid;
        episode.thumbnail_cid = thumbnail_cid;
        episode.image_set_id = image_set_id;
        episode.order = order;
        episode.status = initial_status;
        episode.is_nft = is_nft;
        episode.candy_machine_id = if is_nft { candy_machine_id } else { "".to_string() };
        episode.timestamp = Clock::get()?.unix_timestamp;
        episode.bump = ctx.bumps.episode_account;
        episode.publish_at_time = publish_at_time_option;
        episode.unpublish_at_time = unpublish_at_time_option;
        episode.like_count = 0;
        msg!("Episode created: '{}'", episode.episode_name);
        Ok(())
    }

    pub fn update_episode(
        ctx: Context<UpdateEpisode>,
        new_episode_name: String,
        new_content_cid: String,
        new_thumbnail_cid: String,
        new_image_set_id: String,
        new_order: u32,
        new_status: u8,
        new_is_nft: bool,
        new_candy_machine_id: String,
        new_publish_at_time_option: Option<i64>,
        new_unpublish_at_time_option: Option<i64>,
    ) -> Result<()> {
        if new_episode_name.len() > MAX_EPISODE_NAME_LENGTH { return err!(AppError::EpisodeNameTooLong); }
        if new_content_cid.len() > MAX_EPISODE_CONTENT_CID_LENGTH { return err!(AppError::ContentCidTooLong); }
        if new_thumbnail_cid.len() > MAX_EPISODE_THUMBNAIL_CID_LENGTH { return err!(AppError::EpisodeThumbnailCidTooLong); }
        if new_image_set_id.len() > MAX_IMAGE_SET_ID_LENGTH { return err!(AppError::ImageSetIdTooLong); }
        if new_candy_machine_id.len() > MAX_CANDY_MACHINE_ID_LENGTH { return err!(AppError::CandyMachineIdTooLong); }
        if new_status > EpisodeStatus::Archived as u8 { return err!(AppError::InvalidStatus); }
        if let (Some(publish_ts), Some(unpublish_ts)) = (new_publish_at_time_option, new_unpublish_at_time_option) {
            if publish_ts >= unpublish_ts {
                return err!(AppError::InvalidScheduleTimes);
            }
        }

        let episode = &mut ctx.accounts.episode_account;
        episode.episode_name = new_episode_name;
        episode.content_cid = new_content_cid;
        episode.thumbnail_cid = new_thumbnail_cid;
        episode.image_set_id = new_image_set_id;
        episode.order = new_order;
        episode.status = new_status;
        episode.is_nft = new_is_nft;
        episode.candy_machine_id = if new_is_nft { new_candy_machine_id } else { "".to_string() };
        episode.timestamp = Clock::get()?.unix_timestamp;
        episode.publish_at_time = new_publish_at_time_option;
        episode.unpublish_at_time = new_unpublish_at_time_option;
        msg!("Episode updated: {}", episode.episode_name);
        Ok(())
    }

    pub fn delete_episode(ctx: Context<DeleteEpisode>) -> Result<()> {
        msg!("Episode deleted: {}", ctx.accounts.episode_account.episode_name);
        Ok(())
    }

    pub fn like_episode(ctx: Context<LikeEpisode>) -> Result<()> {
        let episode = &mut ctx.accounts.episode_account;
        episode.like_count = episode.like_count.checked_add(1).ok_or(AppError::LikeCountOverflow)?;
        msg!("Episode '{}' liked by {}. New like count: {}", episode.episode_name, ctx.accounts.user.key(), episode.like_count);
        Ok(())
    }

    pub fn like_tale(ctx: Context<LikeTale>) -> Result<()> {
        let tale = &mut ctx.accounts.tale_account;
        tale.like_count = tale.like_count.checked_add(1).ok_or(AppError::LikeCountOverflow)?;
        msg!("Tale '{}' liked by {}. New like count: {}", tale.title, ctx.accounts.user.key(), tale.like_count);
        Ok(())
    }
}

// --- Contexts ---
#[derive(Accounts)]
#[instruction(tale_id: String)]
pub struct CreateTale<'info> {
    #[account(
        init,
        payer = author,
        space = TALE_ACCOUNT_SPACE, // Updated space
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
        has_one = author @ AppError::Unauthorized
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
        has_one = author @ AppError::Unauthorized,
        close = author
    )]
    pub tale_account: Account<'info, Tale>,
    #[account(mut)]
    pub author: Signer<'info>,
}

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
            episode_account.parent_tale.as_ref(),
            episode_account.episode_id_seed.as_bytes()
        ],
        bump = episode_account.bump,
        has_one = author @ AppError::Unauthorized
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
        has_one = author @ AppError::Unauthorized,
        close = author
    )]
    pub episode_account: Account<'info, Episode>,
    #[account(mut)]
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct LikeEpisode<'info> {
    #[account(mut)]
    pub episode_account: Account<'info, Episode>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct LikeTale<'info> {
    #[account(mut)]
    pub tale_account: Account<'info, Tale>,
    #[account(mut)]
    pub user: Signer<'info>,
}