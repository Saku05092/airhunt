use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

mod config;
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

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = Arc::new(AppState {
        onchain: services::onchain::OnchainClient::new(),
    });

    let app = Router::new()
        .route("/health", get(routes::health::health_check))
        .route("/api/sybil/analyze", post(routes::sybil::analyze))
        .route("/api/estimate", post(routes::estimator::estimate))
        .route("/api/portfolio", post(routes::portfolio::get_portfolio))
        .route("/api/export", post(routes::export::export_csv))
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
