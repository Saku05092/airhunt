use crate::models::portfolio::ExportRequest;
use crate::services::onchain::OnchainClient;
use crate::utils::eth_math;

pub async fn build_csv(
    onchain: &OnchainClient,
    req: &ExportRequest,
) -> Result<String, anyhow::Error> {
    let mut writer = csv::Writer::from_writer(Vec::new());

    writer.write_record([
        "address",
        "chain",
        "tx_hash",
        "from",
        "to",
        "value",
        "gas_eth",
        "gas_usd",
        "timestamp",
        "is_error",
    ])?;

    for wallet in &req.addresses {
        let txs = onchain
            .fetch_transactions(&wallet.address, wallet.chain.as_str())
            .await
            .unwrap_or_default();

        for tx in &txs {
            if let Some(ref range) = req.date_range {
                let ts: u64 = tx.timestamp.parse().unwrap_or(0);
                let start: u64 = range.start.parse().unwrap_or(0);
                let end: u64 = range.end.parse().unwrap_or(u64::MAX);
                if ts < start || ts > end {
                    continue;
                }
            }

            let gas_eth = eth_math::compute_gas_eth(&tx.gas_used, &tx.gas_price);
            let gas_usd = eth_math::estimate_usd(gas_eth, wallet.chain.as_str());
            let chain_str = wallet.chain.as_str();

            writer.write_record([
                &wallet.address,
                chain_str,
                &tx.hash,
                &tx.from,
                &tx.to,
                &tx.value,
                &format!("{:.8}", gas_eth),
                &format!("{:.2}", gas_usd),
                &tx.timestamp,
                &tx.is_error.to_string(),
            ])?;
        }
    }

    let data = writer.into_inner()?;
    Ok(String::from_utf8(data)?)
}
