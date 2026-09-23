// This module contains helper functions for mission management
// Currently empty as main logic is in lib.rs
// Can be extended for additional mission utilities

use crate::types::{Mission, MissionStatus};

/// Check if a mission is claimable
pub fn is_claimable(mission: &Mission, current_timestamp: u64) -> bool {
    mission.status == MissionStatus::Active
        && mission.current_claimers < mission.max_claimers
        && current_timestamp < mission.deadline
}

/// Calculate remaining slots for a mission
pub fn remaining_slots(mission: &Mission) -> u32 {
    if mission.current_claimers >= mission.max_claimers {
        0
    } else {
        mission.max_claimers - mission.current_claimers
    }
}

/// Calculate total funds required for a mission
pub fn total_funds_required(mission: &Mission) -> i128 {
    mission.reward_amount * mission.max_claimers as i128
}

/// Check if mission is fully funded
pub fn is_fully_funded(mission: &Mission) -> bool {
    mission.funded_amount >= total_funds_required(mission)
}
