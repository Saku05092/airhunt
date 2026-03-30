use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use std::sync::Arc;

use crate::models::sybil::{SybilAnalyzeRequest, SybilRiskResult};
use crate::services::sybil_analyzer::SybilAnalyzer;
use crate::AppState;

pub async fn analyze(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SybilAnalyzeRequest>,
) -> Result<Json<SybilRiskResult>, (StatusCode, String)> {
    let analyzer = SybilAnalyzer::new(&state.onchain);
    let result = analyzer
        .analyze(&payload.addresses, &payload.chains)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(result))
}
