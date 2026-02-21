use anchor_lang::prelude::*;

declare_id!("B6CSWaYtxem8bPEHe3CRCZ52n7kuRrZJbqw3dkFhSZAp");

#[program]
pub mod govfund {
    use super::*;

    /// Creates a new government-funded project on-chain.
    pub fn create_project(
        ctx: Context<CreateProject>,
        project_id: String,
        name: String,
        province: String,
        district: String,
        sector: String,
        contractor: String,
        total_budget: u64,
        milestone_count: u8,
        estimated_completion: i64,
    ) -> Result<()> {
        require!(project_id.len() <= 32, GovFundError::StringTooLong);
        require!(name.len() <= 64, GovFundError::StringTooLong);
        require!(province.len() <= 32, GovFundError::StringTooLong);
        require!(district.len() <= 32, GovFundError::StringTooLong);
        require!(sector.len() <= 32, GovFundError::StringTooLong);
        require!(contractor.len() <= 64, GovFundError::StringTooLong);
        require!(total_budget > 0, GovFundError::InvalidBudget);
        require!(milestone_count > 0 && milestone_count <= 20, GovFundError::InvalidMilestoneCount);

        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        project.project_id = project_id.clone();
        project.name = name.clone();
        project.province = province.clone();
        project.district = district.clone();
        project.sector = sector.clone();
        project.contractor = contractor.clone();
        project.total_budget = total_budget;
        project.allocated_budget = 0;
        project.released_amount = 0;
        project.status = ProjectStatus::Active;
        project.milestone_count = milestone_count;
        project.milestones_completed = 0;
        project.admin = ctx.accounts.admin.key();
        project.created_at = clock.unix_timestamp;
        project.updated_at = clock.unix_timestamp;
        project.estimated_completion = estimated_completion;
        project.document_count = 0;
        project.bump = ctx.bumps.project;

        emit!(ProjectCreated {
            project_id,
            name,
            province,
            district,
            sector,
            contractor,
            total_budget,
            milestone_count,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Allocates budget to a project. Cannot exceed total_budget.
    pub fn allocate_budget(
        ctx: Context<AllocateBudget>,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        require!(
            project.status == ProjectStatus::Active,
            GovFundError::ProjectNotActive
        );
        require!(
            project.allocated_budget.checked_add(amount).unwrap() <= project.total_budget,
            GovFundError::ExceedsBudget
        );

        project.allocated_budget = project.allocated_budget.checked_add(amount).unwrap();
        project.updated_at = clock.unix_timestamp;

        emit!(BudgetAllocated {
            project_id: project.project_id.clone(),
            amount,
            new_allocated_total: project.allocated_budget,
            total_budget: project.total_budget,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Releases funds for a project. Cannot exceed allocated budget.
    pub fn release_funds(
        ctx: Context<ReleaseFunds>,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        require!(
            project.status == ProjectStatus::Active,
            GovFundError::ProjectNotActive
        );
        require!(
            project.released_amount.checked_add(amount).unwrap() <= project.allocated_budget,
            GovFundError::ExceedsAllocated
        );

        project.released_amount = project.released_amount.checked_add(amount).unwrap();
        project.updated_at = clock.unix_timestamp;

        emit!(FundsReleased {
            project_id: project.project_id.clone(),
            amount,
            new_released_total: project.released_amount,
            allocated_budget: project.allocated_budget,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Records an IPFS document hash on-chain for a project.
    pub fn record_document(
        ctx: Context<RecordDocument>,
        ipfs_hash: String,
        document_name: String,
    ) -> Result<()> {
        require!(ipfs_hash.len() <= 64, GovFundError::StringTooLong);
        require!(document_name.len() <= 64, GovFundError::StringTooLong);

        let doc = &mut ctx.accounts.document;
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        doc.project = project.key();
        doc.ipfs_hash = ipfs_hash.clone();
        doc.document_name = document_name.clone();
        doc.uploaded_at = clock.unix_timestamp;
        doc.uploader = ctx.accounts.admin.key();
        doc.index = project.document_count;
        doc.bump = ctx.bumps.document;

        project.document_count = project.document_count.checked_add(1).unwrap();
        project.updated_at = clock.unix_timestamp;

        emit!(DocumentRecorded {
            project_id: project.project_id.clone(),
            ipfs_hash,
            document_name,
            index: doc.index,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Updates milestone status for a project.
    pub fn update_milestone_status(
        ctx: Context<UpdateMilestone>,
        milestone_index: u8,
        description: String,
        new_status: MilestoneStatus,
    ) -> Result<()> {
        require!(description.len() <= 128, GovFundError::StringTooLong);

        let milestone = &mut ctx.accounts.milestone;
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        require!(
            project.status == ProjectStatus::Active,
            GovFundError::ProjectNotActive
        );
        require!(
            milestone_index < project.milestone_count,
            GovFundError::InvalidMilestoneIndex
        );

        // If milestone is being marked completed and wasn't before, increment
        if new_status == MilestoneStatus::Completed && milestone.status != MilestoneStatus::Completed {
            project.milestones_completed = project.milestones_completed.checked_add(1).unwrap();
        }

        milestone.project = project.key();
        milestone.index = milestone_index;
        milestone.description = description.clone();
        milestone.status = new_status.clone();
        milestone.updated_at = clock.unix_timestamp;
        milestone.bump = ctx.bumps.milestone;

        project.updated_at = clock.unix_timestamp;

        emit!(MilestoneUpdated {
            project_id: project.project_id.clone(),
            milestone_index,
            description,
            status: new_status,
            milestones_completed: project.milestones_completed,
            total_milestones: project.milestone_count,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Closes a project. No further mutations allowed after this.
    pub fn close_project(
        ctx: Context<CloseProject>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        require!(
            project.status == ProjectStatus::Active,
            GovFundError::ProjectNotActive
        );

        project.status = ProjectStatus::Completed;
        project.updated_at = clock.unix_timestamp;

        emit!(ProjectClosed {
            project_id: project.project_id.clone(),
            total_budget: project.total_budget,
            released_amount: project.released_amount,
            milestones_completed: project.milestones_completed,
            total_milestones: project.milestone_count,
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ============================================================
// ACCOUNTS
// ============================================================

#[derive(Accounts)]
#[instruction(project_id: String)]
pub struct CreateProject<'info> {
    #[account(
        init,
        payer = admin,
        space = Project::SPACE,
        seeds = [b"project", project_id.as_bytes()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AllocateBudget<'info> {
    #[account(
        mut,
        has_one = admin @ GovFundError::Unauthorized,
    )]
    pub project: Account<'info, Project>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(
        mut,
        has_one = admin @ GovFundError::Unauthorized,
    )]
    pub project: Account<'info, Project>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(ipfs_hash: String, document_name: String)]
pub struct RecordDocument<'info> {
    #[account(
        init,
        payer = admin,
        space = DocumentRecord::SPACE,
        seeds = [b"document", project.key().as_ref(), &project.document_count.to_le_bytes()],
        bump
    )]
    pub document: Account<'info, DocumentRecord>,
    #[account(
        mut,
        has_one = admin @ GovFundError::Unauthorized,
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct UpdateMilestone<'info> {
    #[account(
        init_if_needed,
        payer = admin,
        space = Milestone::SPACE,
        seeds = [b"milestone", project.key().as_ref(), &[milestone_index]],
        bump
    )]
    pub milestone: Account<'info, Milestone>,
    #[account(
        mut,
        has_one = admin @ GovFundError::Unauthorized,
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseProject<'info> {
    #[account(
        mut,
        has_one = admin @ GovFundError::Unauthorized,
    )]
    pub project: Account<'info, Project>,
    pub admin: Signer<'info>,
}

// ============================================================
// STATE
// ============================================================

#[account]
pub struct Project {
    pub project_id: String,        // max 32
    pub name: String,              // max 64
    pub province: String,          // max 32
    pub district: String,          // max 32
    pub sector: String,            // max 32
    pub contractor: String,        // max 64
    pub total_budget: u64,
    pub allocated_budget: u64,
    pub released_amount: u64,
    pub status: ProjectStatus,
    pub milestone_count: u8,
    pub milestones_completed: u8,
    pub admin: Pubkey,
    pub created_at: i64,
    pub updated_at: i64,
    pub estimated_completion: i64,
    pub document_count: u16,
    pub bump: u8,
}

impl Project {
    // Discriminator(8) + strings(4+32 + 4+64 + 4+32 + 4+32 + 4+32 + 4+64)
    // + u64*3(24) + enum(1+1) + u8*2(2) + pubkey(32) + i64*3(24) + u16(2) + u8(1)
    pub const SPACE: usize = 8 + (4 + 32) + (4 + 64) + (4 + 32) + (4 + 32) + (4 + 32) + (4 + 64) + 24 + 2 + 2 + 32 + 24 + 2 + 1 + 64;
}

#[account]
pub struct Milestone {
    pub project: Pubkey,
    pub index: u8,
    pub description: String,       // max 128
    pub status: MilestoneStatus,
    pub updated_at: i64,
    pub bump: u8,
}

impl Milestone {
    pub const SPACE: usize = 8 + 32 + 1 + (4 + 128) + 2 + 8 + 1 + 32;
}

#[account]
pub struct DocumentRecord {
    pub project: Pubkey,
    pub ipfs_hash: String,         // max 64
    pub document_name: String,     // max 64
    pub uploaded_at: i64,
    pub uploader: Pubkey,
    pub index: u16,
    pub bump: u8,
}

impl DocumentRecord {
    pub const SPACE: usize = 8 + 32 + (4 + 64) + (4 + 64) + 8 + 32 + 2 + 1 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProjectStatus {
    Active,
    Completed,
    Suspended,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    InProgress,
    Completed,
    Delayed,
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct ProjectCreated {
    pub project_id: String,
    pub name: String,
    pub province: String,
    pub district: String,
    pub sector: String,
    pub contractor: String,
    pub total_budget: u64,
    pub milestone_count: u8,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct BudgetAllocated {
    pub project_id: String,
    pub amount: u64,
    pub new_allocated_total: u64,
    pub total_budget: u64,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FundsReleased {
    pub project_id: String,
    pub amount: u64,
    pub new_released_total: u64,
    pub allocated_budget: u64,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DocumentRecorded {
    pub project_id: String,
    pub ipfs_hash: String,
    pub document_name: String,
    pub index: u16,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneUpdated {
    pub project_id: String,
    pub milestone_index: u8,
    pub description: String,
    pub status: MilestoneStatus,
    pub milestones_completed: u8,
    pub total_milestones: u8,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProjectClosed {
    pub project_id: String,
    pub total_budget: u64,
    pub released_amount: u64,
    pub milestones_completed: u8,
    pub total_milestones: u8,
    pub admin: Pubkey,
    pub timestamp: i64,
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum GovFundError {
    #[msg("String exceeds maximum allowed length")]
    StringTooLong,
    #[msg("Budget amount must be greater than zero")]
    InvalidBudget,
    #[msg("Milestone count must be between 1 and 20")]
    InvalidMilestoneCount,
    #[msg("Project is not in Active status")]
    ProjectNotActive,
    #[msg("Amount exceeds total budget")]
    ExceedsBudget,
    #[msg("Amount exceeds allocated budget")]
    ExceedsAllocated,
    #[msg("Unauthorized: signer is not the project admin")]
    Unauthorized,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
}
