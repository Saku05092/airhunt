use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{Duration, Instant};

pub struct RateLimiter {
    last_calls: Arc<Mutex<HashMap<String, Instant>>>,
    min_interval: Duration,
}

impl RateLimiter {
    pub fn new(min_interval_ms: u64) -> Self {
        Self {
            last_calls: Arc::new(Mutex::new(HashMap::new())),
            min_interval: Duration::from_millis(min_interval_ms),
        }
    }

    pub async fn wait(&self, chain: &str) {
        let mut map = self.last_calls.lock().await;
        if let Some(last) = map.get(chain) {
            let elapsed = last.elapsed();
            if elapsed < self.min_interval {
                let wait_time = self.min_interval - elapsed;
                drop(map);
                tokio::time::sleep(wait_time).await;
                let mut map = self.last_calls.lock().await;
                map.insert(chain.to_string(), Instant::now());
            } else {
                map.insert(chain.to_string(), Instant::now());
            }
        } else {
            map.insert(chain.to_string(), Instant::now());
        }
    }
}
