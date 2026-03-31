use std::collections::HashMap;

use crate::models::portfolio::{PortfolioSummary, TokenBalance, WalletPortfolio};
use crate::models::wallet::WalletAddress;
use crate::services::onchain::OnchainClient;
use crate::utils::eth_math;

pub async fn fetch_portfolio(
    onchain: &OnchainClient,
    addresses: &[WalletAddress],
) -> Result<PortfolioSummary, anyhow::Error> {
    let mut wallet_portfolios = Vec::new();
    let mut total_gas_usd = 0.0;

    for wallet in addresses {
        let txs = onchain
            .fetch_transactions(&wallet.address, wallet.chain.as_str())
            .await
            .unwrap_or_default();

        let token_txs = onchain
            .fetch_token_transfers(&wallet.address, wallet.chain.as_str())
            .await
            .unwrap_or_default();

        let gas_eth: f64 = txs
            .iter()
            .filter(|tx| tx.from.to_lowercase() == wallet.address.to_lowercase())
            .map(|tx| eth_math::compute_gas_eth(&tx.gas_used, &tx.gas_price))
            .sum();

        let gas_usd = eth_math::estimate_usd(gas_eth, wallet.chain.as_str());
        total_gas_usd += gas_usd;

        let tokens = aggregate_token_balances(&token_txs, &wallet.address);

        wallet_portfolios.push(WalletPortfolio {
            address: wallet.address.clone(),
            label: format!("Wallet {}", truncate_address(&wallet.address)),
            chain: wallet.chain.as_str().to_string(),
            native_balance: "0".to_string(),
            tokens,
            gas_spent_eth: format!("{:.6}", gas_eth),
            gas_spent_usd: gas_usd,
        });
    }

    Ok(PortfolioSummary {
        total_gas_spent_usd: total_gas_usd,
        total_wallets: addresses.len(),
        wallet_portfolios,
        fetched_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn aggregate_token_balances(token_txs: &[crate::models::wallet::Transaction], address: &str) -> Vec<TokenBalance> {
    let addr_lower = address.to_lowercase();
    let mut balances: HashMap<String, (String, String, i128)> = HashMap::new();

    for tx in token_txs {
        let contract = tx.to.to_lowercase();
        let value: i128 = tx.value.parse().unwrap_or(0);

        let entry = balances
            .entry(contract.clone())
            .or_insert_with(|| (contract.clone(), "TOKEN".to_string(), 0));

        if tx.from.to_lowercase() == addr_lower {
            entry.2 -= value;
        } else {
            entry.2 += value;
        }
    }

    balances
        .into_iter()
        .filter(|(_, (_, _, bal))| *bal > 0)
        .map(|(contract, (_, symbol, balance))| TokenBalance {
            contract_address: contract,
            symbol,
            name: "Unknown Token".to_string(),
            balance: balance.to_string(),
            decimals: 18,
        })
        .collect()
}

fn truncate_address(addr: &str) -> String {
    if addr.len() > 10 {
        format!("{}...{}", &addr[..6], &addr[addr.len() - 4..])
    } else {
        addr.to_string()
    }
}
