use alloy_primitives::U256;

pub fn compute_gas_eth(gas_used: &str, gas_price: &str) -> f64 {
    let used = gas_used
        .parse::<U256>()
        .unwrap_or_default();
    let price = gas_price
        .parse::<U256>()
        .unwrap_or_default();
    let wei = used.wrapping_mul(price);
    let eth_str = format_wei_to_eth(wei);
    eth_str.parse::<f64>().unwrap_or(0.0)
}

pub fn format_wei_to_eth(wei: U256) -> String {
    let eth_divisor = U256::from(1_000_000_000_000_000_000u64);
    let whole = wei / eth_divisor;
    let remainder = wei % eth_divisor;

    let remainder_str = format!("{:018}", remainder);
    let trimmed = remainder_str.trim_end_matches('0');
    if trimmed.is_empty() {
        format!("{}.0", whole)
    } else {
        format!("{}.{}", whole, trimmed)
    }
}

pub fn estimate_usd(eth: f64, chain: &str) -> f64 {
    let price = match chain {
        "ethereum" => 3500.0,
        "arbitrum" | "optimism" | "base" => 3500.0,
        "polygon" => 0.5,
        _ => 0.0,
    };
    eth * price
}
