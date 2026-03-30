use serde::{Deserialize, Serialize};

// Request: accept snake_case from client
#[derive(Debug, Clone, Deserialize)]
pub struct SybilAnalyzeRequest {
    pub addresses: Vec<String>,
    pub chains: Vec<String>,
}

// Response: serialize as camelCase for TypeScript client
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SybilRiskResult {
    pub overall_score: f64,
    pub risk_level: String,
    pub factors: Vec<SybilRiskFactor>,
    pub recommendations: Vec<String>,
    pub analyzed_at: String,
    pub wallet_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SybilRiskFactor {
    pub id: String,
    pub name: String,
    pub score: f64,
    pub weight: f64,
    pub severity: String,
    pub description: String,
    pub recommendation: String,
}
