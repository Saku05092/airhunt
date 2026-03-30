use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Mutex;
use std::time::Instant;

static RATE_STATE: Mutex<Option<RateState>> = Mutex::new(None);

struct RateState {
    tokens: u32,
    last_refill: Instant,
}

const MAX_REQUESTS: u32 = 30;
const WINDOW_SECS: u64 = 60;

pub async fn rate_limit(req: Request, next: Next) -> Result<Response, StatusCode> {
    {
        let mut state = RATE_STATE.lock().unwrap_or_else(|e| e.into_inner());
        let now = Instant::now();

        let rs = state.get_or_insert_with(|| RateState {
            tokens: MAX_REQUESTS,
            last_refill: now,
        });

        let elapsed = now.duration_since(rs.last_refill).as_secs();
        if elapsed >= WINDOW_SECS {
            rs.tokens = MAX_REQUESTS;
            rs.last_refill = now;
        }

        if rs.tokens == 0 {
            return Err(StatusCode::TOO_MANY_REQUESTS);
        }

        rs.tokens -= 1;
    }

    Ok(next.run(req).await)
}
