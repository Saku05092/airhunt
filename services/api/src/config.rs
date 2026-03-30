pub struct ChainConfig {
    pub name: &'static str,
    pub api_url: &'static str,
    pub api_key_env: &'static str,
}

pub const CHAIN_CONFIGS: &[ChainConfig] = &[
    ChainConfig {
        name: "ethereum",
        api_url: "https://api.etherscan.io/api",
        api_key_env: "ETHERSCAN_API_KEY",
    },
    ChainConfig {
        name: "arbitrum",
        api_url: "https://api.arbiscan.io/api",
        api_key_env: "ARBISCAN_API_KEY",
    },
    ChainConfig {
        name: "optimism",
        api_url: "https://api-optimistic.etherscan.io/api",
        api_key_env: "OPTIMISM_API_KEY",
    },
    ChainConfig {
        name: "base",
        api_url: "https://api.basescan.org/api",
        api_key_env: "BASESCAN_API_KEY",
    },
    ChainConfig {
        name: "polygon",
        api_url: "https://api.polygonscan.com/api",
        api_key_env: "POLYGONSCAN_API_KEY",
    },
];

pub fn get_api_url(chain: &str) -> &'static str {
    CHAIN_CONFIGS
        .iter()
        .find(|c| c.name == chain)
        .map(|c| c.api_url)
        .unwrap_or("https://api.etherscan.io/api")
}

pub fn get_api_key(chain: &str) -> Option<String> {
    CHAIN_CONFIGS
        .iter()
        .find(|c| c.name == chain)
        .and_then(|c| std::env::var(c.api_key_env).ok())
}
