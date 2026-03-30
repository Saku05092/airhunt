use crate::models::estimate::{AirdropEstimate, ComparableAirdrop, EstimateRequest};

const HISTORICAL_AIRDROPS: &[(&str, &str, f64, &str, &str, &str, &str)] = &[
    ("Uniswap", "UNI", 1200.0, "tier1", "defi", "100M", "2020-09-17"),
    ("dYdX", "DYDX", 4500.0, "tier1", "defi", "87M", "2021-09-08"),
    ("Optimism", "OP", 900.0, "tier1", "l2", "150M", "2022-05-31"),
    ("Arbitrum", "ARB", 1500.0, "tier1", "l2", "120M", "2023-03-23"),
    ("Aptos", "APT", 800.0, "tier1", "l1", "350M", "2022-10-19"),
    ("Blur", "BLUR", 2400.0, "tier1", "nft", "11M", "2023-02-14"),
    ("ENS", "ENS", 3000.0, "tier1", "infra", "0", "2021-11-09"),
    ("1inch", "1INCH", 600.0, "tier2", "defi", "15M", "2020-12-25"),
    ("Hop Protocol", "HOP", 200.0, "tier2", "bridge", "3M", "2022-06-09"),
    ("Paraswap", "PSP", 400.0, "tier2", "defi", "3M", "2021-11-15"),
    ("Gitcoin", "GTC", 700.0, "tier2", "infra", "11M", "2021-05-25"),
    ("Jito", "JTO", 5000.0, "tier1", "defi", "12M", "2023-12-07"),
    ("Jupiter", "JUP", 1000.0, "tier1", "defi", "0", "2024-01-31"),
    ("Starknet", "STRK", 700.0, "tier1", "l2", "282M", "2024-02-20"),
    ("Eigenlayer", "EIGEN", 350.0, "tier1", "infra", "164M", "2024-05-10"),
    ("Wormhole", "W", 500.0, "tier1", "bridge", "225M", "2024-04-03"),
    ("Celestia", "TIA", 2000.0, "tier1", "l1", "55M", "2023-10-31"),
    ("ZkSync", "ZK", 200.0, "tier1", "l2", "458M", "2024-06-17"),
    ("LayerZero", "ZRO", 150.0, "tier1", "infra", "263M", "2024-06-20"),
];

pub fn estimate_airdrop(req: &EstimateRequest) -> Result<AirdropEstimate, anyhow::Error> {
    let comparables = find_comparables(&req.tier, &req.category);

    if comparables.is_empty() {
        return Ok(AirdropEstimate {
            campaign_id: req.campaign_id.clone(),
            low: 0.0,
            median: 0.0,
            high: 0.0,
            confidence: "none".to_string(),
            comparables: vec![],
            user_multiplier: 1.0,
        });
    }

    let mut values: Vec<f64> = comparables.iter().map(|c| c.median_value).collect();
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let len = values.len();
    let p25 = values[len / 4];
    let median = values[len / 2];
    let p75 = values[(len * 3) / 4];

    let funding_multiplier = compute_funding_multiplier(&req.funding_raised);
    let activity_multiplier = compute_activity_multiplier(req.user_tx_count);
    let user_multiplier = funding_multiplier * activity_multiplier;

    let confidence = match len {
        0..=2 => "low",
        3..=5 => "medium",
        _ => "high",
    };

    Ok(AirdropEstimate {
        campaign_id: req.campaign_id.clone(),
        low: p25 * user_multiplier,
        median: median * user_multiplier,
        high: p75 * user_multiplier,
        confidence: confidence.to_string(),
        comparables,
        user_multiplier,
    })
}

fn find_comparables(tier: &str, category: &str) -> Vec<ComparableAirdrop> {
    let tier_lower = tier.to_lowercase();
    let category_lower = category.to_lowercase();

    let mut results: Vec<ComparableAirdrop> = HISTORICAL_AIRDROPS
        .iter()
        .filter(|(_, _, _, t, c, _, _)| {
            *t == tier_lower || *c == category_lower
        })
        .map(|(name, ticker, median, t, c, funding, date)| ComparableAirdrop {
            name: name.to_string(),
            ticker: ticker.to_string(),
            median_value: *median,
            tier: t.to_string(),
            category: c.to_string(),
            funding_raised: funding.to_string(),
            date: date.to_string(),
        })
        .collect();

    results.sort_by(|a, b| {
        b.median_value
            .partial_cmp(&a.median_value)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    results.truncate(10);
    results
}

fn compute_funding_multiplier(funding_str: &str) -> f64 {
    let cleaned = funding_str
        .replace('M', "")
        .replace('B', "000")
        .replace('$', "")
        .trim()
        .to_string();
    let funding_m: f64 = cleaned.parse().unwrap_or(0.0);

    match funding_m as u64 {
        0..=10 => 0.8,
        11..=50 => 1.0,
        51..=200 => 1.2,
        _ => 1.4,
    }
}

fn compute_activity_multiplier(tx_count: u64) -> f64 {
    match tx_count {
        0..=5 => 0.5,
        6..=20 => 0.8,
        21..=50 => 1.0,
        51..=100 => 1.3,
        _ => 1.5,
    }
}
