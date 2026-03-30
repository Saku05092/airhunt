use reqwest::Client;

use crate::config;
use crate::models::wallet::Transaction;
use crate::utils::rate_limiter::RateLimiter;

pub struct OnchainClient {
    client: Client,
    rate_limiter: RateLimiter,
}

fn is_valid_evm_address(addr: &str) -> bool {
    addr.len() == 42
        && addr.starts_with("0x")
        && addr[2..].chars().all(|c| c.is_ascii_hexdigit())
}

fn encode_param(s: &str) -> String {
    s.chars().map(|c| {
        if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' || c == '~' {
            c.to_string()
        } else {
            format!("%{:02X}", c as u32)
        }
    }).collect()
}

impl OnchainClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            rate_limiter: RateLimiter::new(250),
        }
    }

    fn api_url(&self, chain: &str) -> &str {
        config::get_api_url(chain)
    }

    fn api_key(&self, chain: &str) -> String {
        config::get_api_key(chain).unwrap_or_default()
    }

    pub async fn fetch_transactions(
        &self,
        address: &str,
        chain: &str,
    ) -> Result<Vec<Transaction>, anyhow::Error> {
        if !is_valid_evm_address(address) {
            return Ok(vec![]);
        }
        self.rate_limiter.wait(chain).await;
        let encoded_address = encode_param(address);
        let url = format!(
            "{}?module=account&action=txlist&address={}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey={}",
            self.api_url(chain),
            encoded_address,
            self.api_key(chain)
        );
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let txs = parse_transaction_array(&resp);
        Ok(txs)
    }

    pub async fn fetch_token_transfers(
        &self,
        address: &str,
        chain: &str,
    ) -> Result<Vec<Transaction>, anyhow::Error> {
        if !is_valid_evm_address(address) {
            return Ok(vec![]);
        }
        self.rate_limiter.wait(chain).await;
        let encoded_address = encode_param(address);
        let url = format!(
            "{}?module=account&action=tokentx&address={}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey={}",
            self.api_url(chain),
            encoded_address,
            self.api_key(chain)
        );
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let txs = parse_transaction_array(&resp);
        Ok(txs)
    }

    pub async fn fetch_nft_transfers(
        &self,
        address: &str,
        chain: &str,
    ) -> Result<Vec<Transaction>, anyhow::Error> {
        if !is_valid_evm_address(address) {
            return Ok(vec![]);
        }
        self.rate_limiter.wait(chain).await;
        let encoded_address = encode_param(address);
        let url = format!(
            "{}?module=account&action=tokennfttx&address={}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey={}",
            self.api_url(chain),
            encoded_address,
            self.api_key(chain)
        );
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let txs = parse_transaction_array(&resp);
        Ok(txs)
    }

    pub async fn fetch_first_transaction(
        &self,
        address: &str,
        chain: &str,
    ) -> Result<Option<Transaction>, anyhow::Error> {
        if !is_valid_evm_address(address) {
            return Ok(None);
        }
        self.rate_limiter.wait(chain).await;
        let encoded_address = encode_param(address);
        let url = format!(
            "{}?module=account&action=txlist&address={}&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey={}",
            self.api_url(chain),
            encoded_address,
            self.api_key(chain)
        );
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;
        let txs = parse_transaction_array(&resp);
        Ok(txs.into_iter().next())
    }
}

fn parse_transaction_array(resp: &serde_json::Value) -> Vec<Transaction> {
    let empty = vec![];
    let results = resp["result"].as_array().unwrap_or(&empty);
    results
        .iter()
        .filter_map(|item| {
            Some(Transaction {
                hash: item["hash"].as_str()?.to_string(),
                from: item["from"].as_str().unwrap_or_default().to_string(),
                to: item["to"].as_str().unwrap_or_default().to_string(),
                value: item["value"].as_str().unwrap_or("0").to_string(),
                gas_used: item["gasUsed"].as_str().unwrap_or("0").to_string(),
                gas_price: item["gasPrice"].as_str().unwrap_or("0").to_string(),
                timestamp: item["timeStamp"].as_str().unwrap_or("0").to_string(),
                is_error: item["isError"].as_str().unwrap_or("0") == "1",
            })
        })
        .collect()
}
