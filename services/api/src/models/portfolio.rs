use serde::{Deserialize, Serialize};

use super::wallet::WalletAddress;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioRequest {
    pub addresses: Vec<WalletAddress>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioSummary {
    pub total_gas_spent_usd: f64,
    pub total_wallets: usize,
    pub wallet_portfolios: Vec<WalletPortfolio>,
    pub fetched_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletPortfolio {
    pub address: String,
    pub label: String,
    pub chain: String,
    pub native_balance: String,
    pub tokens: Vec<TokenBalance>,
    pub gas_spent_eth: String,
    pub gas_spent_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBalance {
    pub contract_address: String,
    pub symbol: String,
    pub name: String,
    pub balance: String,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub addresses: Vec<WalletAddress>,
    pub date_range: Option<DateRange>,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateRange {
    pub start: String,
    pub end: String,
}
