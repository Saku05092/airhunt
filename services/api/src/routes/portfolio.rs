use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use std::sync::Arc;

use crate::models::portfolio::{PortfolioRequest, PortfolioSummary};
use crate::services::portfolio_service;
use crate::AppState;

pub async fn get_portfolio(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PortfolioRequest>,
) -> Result<Json<PortfolioSummary>, (StatusCode, String)> {
    let result = portfolio_service::fetch_portfolio(&state.onchain, &payload.addresses)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(result))
}
