use std::collections::{HashMap, HashSet};

use crate::models::sybil::{SybilRiskFactor, SybilRiskResult};
use crate::models::wallet::Transaction;
use crate::services::onchain::OnchainClient;

struct WalletData {
    address: String,
    transactions: Vec<Transaction>,
    first_tx: Option<Transaction>,
    active_chains: Vec<String>,
}

pub struct SybilAnalyzer<'a> {
    onchain: &'a OnchainClient,
}

impl<'a> SybilAnalyzer<'a> {
    pub fn new(onchain: &'a OnchainClient) -> Self {
        Self { onchain }
    }

    pub async fn analyze(
        &self,
        addresses: &[String],
        chains: &[String],
    ) -> Result<SybilRiskResult, anyhow::Error> {
        let wallet_data = self.fetch_all_wallet_data(addresses, chains).await?;

        let factors = vec![
            self.check_common_funding(&wallet_data),
            self.check_timing_similarity(&wallet_data),
            self.check_gas_similarity(&wallet_data),
            self.check_protocol_overlap(&wallet_data),
            self.check_age_similarity(&wallet_data),
            self.check_chain_overlap(&wallet_data),
        ];

        let overall_score: f64 = factors.iter().map(|f| f.score * f.weight).sum();
        let clamped = overall_score.min(100.0).max(0.0);

        let risk_level = match clamped as u32 {
            0..=20 => "safe",
            21..=40 => "low",
            41..=60 => "medium",
            61..=80 => "high",
            _ => "critical",
        };

        let recommendations = self.generate_recommendations(&factors);

        Ok(SybilRiskResult {
            overall_score: clamped,
            risk_level: risk_level.to_string(),
            factors,
            recommendations,
            analyzed_at: iso_now(),
            wallet_count: addresses.len(),
        })
    }

    async fn fetch_all_wallet_data(
        &self,
        addresses: &[String],
        chains: &[String],
    ) -> Result<Vec<WalletData>, anyhow::Error> {
        let mut all_data = Vec::new();

        for address in addresses {
            let mut all_txs = Vec::new();
            let mut first_tx: Option<Transaction> = None;
            let mut active_chains = Vec::new();

            for chain in chains {
                let txs = self
                    .onchain
                    .fetch_transactions(address, chain)
                    .await
                    .unwrap_or_default();

                if !txs.is_empty() {
                    active_chains.push(chain.clone());
                }

                let ft = self
                    .onchain
                    .fetch_first_transaction(address, chain)
                    .await
                    .unwrap_or(None);

                if let Some(ref ft_tx) = ft {
                    match &first_tx {
                        None => first_tx = Some(ft_tx.clone()),
                        Some(existing) => {
                            let existing_ts: u64 =
                                existing.timestamp.parse().unwrap_or(u64::MAX);
                            let new_ts: u64 = ft_tx.timestamp.parse().unwrap_or(u64::MAX);
                            if new_ts < existing_ts {
                                first_tx = Some(ft_tx.clone());
                            }
                        }
                    }
                }

                all_txs.extend(txs);
            }

            all_data.push(WalletData {
                address: address.clone(),
                transactions: all_txs,
                first_tx,
                active_chains,
            });
        }

        Ok(all_data)
    }

    fn check_common_funding(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let funding_sources: Vec<Option<String>> = wallets
            .iter()
            .map(|w| w.first_tx.as_ref().map(|tx| tx.from.to_lowercase()))
            .collect();

        let mut source_counts: HashMap<String, usize> = HashMap::new();
        let mut total_with_source = 0usize;

        for source in &funding_sources {
            if let Some(addr) = source {
                *source_counts.entry(addr.clone()).or_insert(0) += 1;
                total_with_source += 1;
            }
        }

        let max_shared = source_counts.values().max().copied().unwrap_or(0);
        let score = if total_with_source > 1 {
            let ratio = max_shared as f64 / total_with_source as f64;
            (ratio * 100.0).min(100.0)
        } else {
            0.0
        };

        let severity = severity_from_score(score);

        SybilRiskFactor {
            id: "common_funding".to_string(),
            name: "Common Funding Source".to_string(),
            score,
            weight: 0.25,
            severity,
            description: format!(
                "{} out of {} wallets share a common funding source",
                max_shared, total_with_source
            ),
            recommendation: if score > 50.0 {
                "Use different funding sources for each wallet".to_string()
            } else {
                "Funding sources appear diverse".to_string()
            },
        }
    }

    fn check_timing_similarity(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let timestamps: Vec<u64> = wallets
            .iter()
            .filter_map(|w| {
                w.first_tx
                    .as_ref()
                    .and_then(|tx| tx.timestamp.parse().ok())
            })
            .collect();

        let score = if timestamps.len() < 2 {
            0.0
        } else {
            let mean = timestamps.iter().sum::<u64>() as f64 / timestamps.len() as f64;
            let variance =
                timestamps.iter().map(|t| (*t as f64 - mean).powi(2)).sum::<f64>()
                    / timestamps.len() as f64;
            let std_dev = variance.sqrt();

            let hours_dev = std_dev / 3600.0;
            if hours_dev < 24.0 {
                ((24.0 - hours_dev) / 24.0 * 100.0).min(100.0)
            } else if hours_dev < 720.0 {
                ((720.0 - hours_dev) / 720.0 * 40.0).max(0.0)
            } else {
                0.0
            }
        };

        SybilRiskFactor {
            id: "timing_similarity".to_string(),
            name: "Activity Timing Similarity".to_string(),
            score,
            weight: 0.20,
            severity: severity_from_score(score),
            description: format!(
                "Analyzed first activity timestamps across {} wallets",
                wallets.len()
            ),
            recommendation: if score > 50.0 {
                "Spread wallet activity across different time periods".to_string()
            } else {
                "Activity timing appears sufficiently varied".to_string()
            },
        }
    }

    fn check_gas_similarity(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let gas_totals: Vec<f64> = wallets
            .iter()
            .map(|w| {
                w.transactions
                    .iter()
                    .map(|tx| {
                        crate::utils::eth_math::compute_gas_eth(&tx.gas_used, &tx.gas_price)
                    })
                    .sum::<f64>()
            })
            .collect();

        let score = if gas_totals.len() < 2 {
            0.0
        } else {
            let mean = gas_totals.iter().sum::<f64>() / gas_totals.len() as f64;
            if mean == 0.0 {
                0.0
            } else {
                let variance = gas_totals
                    .iter()
                    .map(|g| (g - mean).powi(2))
                    .sum::<f64>()
                    / gas_totals.len() as f64;
                let std_dev = variance.sqrt();
                let cov = std_dev / mean;

                if cov < 0.1 {
                    100.0
                } else if cov < 0.5 {
                    ((0.5 - cov) / 0.4 * 80.0).max(0.0)
                } else {
                    0.0
                }
            }
        };

        SybilRiskFactor {
            id: "gas_similarity".to_string(),
            name: "Gas Usage Similarity".to_string(),
            score,
            weight: 0.15,
            severity: severity_from_score(score),
            description: format!(
                "Compared gas expenditure patterns across {} wallets",
                wallets.len()
            ),
            recommendation: if score > 50.0 {
                "Vary transaction amounts and gas usage between wallets".to_string()
            } else {
                "Gas usage patterns appear distinct".to_string()
            },
        }
    }

    fn check_protocol_overlap(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let wallet_protocols: Vec<HashSet<String>> = wallets
            .iter()
            .map(|w| {
                w.transactions
                    .iter()
                    .map(|tx| tx.to.to_lowercase())
                    .collect::<HashSet<_>>()
            })
            .collect();

        let score = if wallet_protocols.len() < 2 {
            0.0
        } else {
            let mut total_jaccard = 0.0;
            let mut pair_count = 0;

            for i in 0..wallet_protocols.len() {
                for j in (i + 1)..wallet_protocols.len() {
                    let intersection = wallet_protocols[i]
                        .intersection(&wallet_protocols[j])
                        .count();
                    let union = wallet_protocols[i]
                        .union(&wallet_protocols[j])
                        .count();
                    if union > 0 {
                        total_jaccard += intersection as f64 / union as f64;
                    }
                    pair_count += 1;
                }
            }

            if pair_count > 0 {
                (total_jaccard / pair_count as f64 * 100.0).min(100.0)
            } else {
                0.0
            }
        };

        SybilRiskFactor {
            id: "protocol_overlap".to_string(),
            name: "Protocol Interaction Overlap".to_string(),
            score,
            weight: 0.15,
            severity: severity_from_score(score),
            description: format!(
                "Compared protocol interactions across {} wallets using Jaccard similarity",
                wallets.len()
            ),
            recommendation: if score > 50.0 {
                "Diversify protocol interactions across wallets".to_string()
            } else {
                "Protocol usage appears diverse".to_string()
            },
        }
    }

    fn check_age_similarity(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let timestamps: Vec<u64> = wallets
            .iter()
            .filter_map(|w| {
                w.first_tx
                    .as_ref()
                    .and_then(|tx| tx.timestamp.parse().ok())
            })
            .collect();

        let score = if timestamps.len() < 2 {
            0.0
        } else {
            let min_ts = *timestamps.iter().min().unwrap_or(&0);
            let max_ts = *timestamps.iter().max().unwrap_or(&0);
            let spread_seconds = max_ts.saturating_sub(min_ts) as f64;
            let spread_days = spread_seconds / 86400.0;

            if spread_days < 1.0 {
                100.0
            } else if spread_days < 30.0 {
                ((30.0 - spread_days) / 29.0 * 100.0).max(0.0)
            } else {
                0.0
            }
        };

        SybilRiskFactor {
            id: "age_similarity".to_string(),
            name: "Wallet Age Similarity".to_string(),
            score,
            weight: 0.15,
            severity: severity_from_score(score),
            description: format!(
                "Compared wallet creation dates across {} wallets",
                wallets.len()
            ),
            recommendation: if score > 50.0 {
                "Wallets created around the same time increase Sybil risk".to_string()
            } else {
                "Wallet ages appear sufficiently different".to_string()
            },
        }
    }

    fn check_chain_overlap(&self, wallets: &[WalletData]) -> SybilRiskFactor {
        let chain_sets: Vec<HashSet<&String>> = wallets
            .iter()
            .map(|w| w.active_chains.iter().collect::<HashSet<_>>())
            .collect();

        let score = if chain_sets.len() < 2 {
            0.0
        } else {
            let mut identical_pairs = 0;
            let mut total_pairs = 0;

            for i in 0..chain_sets.len() {
                for j in (i + 1)..chain_sets.len() {
                    if chain_sets[i] == chain_sets[j] {
                        identical_pairs += 1;
                    }
                    total_pairs += 1;
                }
            }

            if total_pairs > 0 {
                (identical_pairs as f64 / total_pairs as f64 * 100.0).min(100.0)
            } else {
                0.0
            }
        };

        SybilRiskFactor {
            id: "chain_overlap".to_string(),
            name: "Chain Activity Overlap".to_string(),
            score,
            weight: 0.10,
            severity: severity_from_score(score),
            description: format!(
                "Compared active chain sets across {} wallets",
                wallets.len()
            ),
            recommendation: if score > 50.0 {
                "Use different chain combinations across wallets".to_string()
            } else {
                "Chain usage patterns appear varied".to_string()
            },
        }
    }

    fn generate_recommendations(&self, factors: &[SybilRiskFactor]) -> Vec<String> {
        let mut recs: Vec<String> = factors
            .iter()
            .filter(|f| f.score > 40.0)
            .map(|f| f.recommendation.clone())
            .collect();

        if recs.is_empty() {
            recs.push("No significant Sybil risk indicators detected".to_string());
        }

        recs
    }
}

fn severity_from_score(score: f64) -> String {
    match score as u32 {
        0..=20 => "low".to_string(),
        21..=50 => "medium".to_string(),
        51..=75 => "high".to_string(),
        _ => "critical".to_string(),
    }
}

fn iso_now() -> String {
    chrono::Utc::now().to_rfc3339()
}
