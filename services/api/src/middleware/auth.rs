use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};

pub async fn require_auth(req: Request, next: Next) -> Result<Response, StatusCode> {
    let api_secret = std::env::var("AIRHUNT_API_SECRET").unwrap_or_default();

    // Dev mode: if no secret configured, allow all requests
    if api_secret.is_empty() {
        return Ok(next.run(req).await);
    }

    let auth_header = req.headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let expected = format!("Bearer {}", api_secret);
    if auth_header != expected {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(req).await)
}
