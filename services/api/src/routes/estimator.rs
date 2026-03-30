use axum::http::StatusCode;
use axum::Json;

use crate::models::estimate::{AirdropEstimate, EstimateRequest};
use crate::services::value_estimator;

pub async fn estimate(
    Json(payload): Json<EstimateRequest>,
) -> Result<Json<AirdropEstimate>, (StatusCode, String)> {
    let result = value_estimator::estimate_airdrop(&payload)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(result))
}
