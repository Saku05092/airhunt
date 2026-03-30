use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

mod config;
mod middleware;
mod models;
mod routes;
mod services;
mod utils;

pub struct AppState {
    pub onchain: services::onchain::OnchainClient,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let allowed_origin = std::env::var("ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:8081".to_string());

    let cors = CorsLayer::new()
        .allow_origin(allowed_origin.parse::<axum::http::HeaderValue>().unwrap_or_else(|_| {
            "http://localhost:8081".parse().unwrap()
        }))
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST, axum::http::Method::OPTIONS])
        .allow_headers([axum::http::header::CONTENT_TYPE, axum::http::header::AUTHORIZATION]);

    let state = Arc::new(AppState {
        onchain: services::onchain::OnchainClient::new(),
    });

    let public_routes = Router::new()
        .route("/health", get(routes::health::health_check));

    let api_routes = Router::new()
        .route("/api/sybil/analyze", post(routes::sybil::analyze))
        .route("/api/estimate", post(routes::estimator::estimate))
        .route("/api/portfolio", post(routes::portfolio::get_portfolio))
        .route("/api/export", post(routes::export::export_csv))
        .layer(axum::middleware::from_fn(middleware::auth::require_auth))
        .layer(axum::middleware::from_fn(middleware::rate_limit::rate_limit));

    let app = public_routes
        .merge(api_routes)
        .with_state(state)
        .layer(cors);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3002);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("AirHunt API listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
