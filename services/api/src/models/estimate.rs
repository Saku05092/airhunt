use serde::{Deserialize, Serialize};

// Request: accept snake_case from TypeScript client
#[derive(Debug, Clone, Deserialize)]
pub struct EstimateRequest {
    pub campaign_id: String,
    pub tier: String,
    pub category: String,
    pub funding_raised: String,
    pub user_tx_count: u64,
}

// Response: serialize as camelCase for TypeScript client
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AirdropEstimate {
    pub campaign_id: String,
    pub low: f64,
    pub median: f64,
    pub high: f64,
    pub confidence: String,
    pub comparables: Vec<ComparableAirdrop>,
    pub user_multiplier: f64,
    pub estimated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComparableAirdrop {
    pub name: String,
    pub ticker: String,
    pub median_value: f64,
    pub tier: String,
    pub category: String,
    pub funding_raised: String,
    pub date: String,
}
