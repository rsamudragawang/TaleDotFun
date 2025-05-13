// programs/readium-fun/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("EZ1GQumWC4UwwQBGERwtnMNS6rJRprjP1HhGfhLC2utJ");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
