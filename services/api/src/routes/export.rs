use axum::extract::State;
use axum::http::{header, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use std::sync::Arc;

use crate::models::portfolio::ExportRequest;
use crate::services::export_service;
use crate::AppState;

pub async fn export_csv(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ExportRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let csv_content = export_service::build_csv(&state.onchain, &payload)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let headers = [
        (header::CONTENT_TYPE, "text/csv"),
        (
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"airhunt-export.csv\"",
        ),
    ];

    Ok((headers, csv_content))
}
