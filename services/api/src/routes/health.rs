use axum::Json;

pub async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "airhunt-api",
        "version": "0.1.0"
    }))
}
