use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SybilAnalyzeRequest {
    pub addresses: Vec<String>,
    pub chains: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SybilRiskResult {
    pub overall_score: f64,
    pub risk_level: String,
    pub factors: Vec<SybilRiskFactor>,
    pub recommendations: Vec<String>,
    pub analyzed_at: String,
    pub wallet_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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
