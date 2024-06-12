use anchor_lang::prelude::*;

declare_id!("B4dW82e2t1vw6wSYcj2WqNP8MrUjcC7q1BXcrDWhXDdP");

#[program]
pub mod frogwifcat_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
