use crate::timer;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// コントロール窓を開く（すでにあれば前面に出す）
pub fn open_control(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("control") {
        let _ = w.set_focus();
        return;
    }
    let built = WebviewWindowBuilder::new(app, "control", WebviewUrl::App("control.html".into()))
        .title("LEQVIO TIMER — CONTROL")
        .inner_size(680.0, 440.0)
        .background_color(tauri::window::Color(10, 10, 10, 255))
        .build();
    if built.is_ok() {
        timer::set_linked(app, true);
    }
}

pub fn control_closed(app: &AppHandle) {
    timer::set_linked(app, false);
}

// 窓の生成はメインスレッドを塞がないよう async コマンドにする
#[tauri::command]
pub async fn open_control_cmd(app: AppHandle) {
    open_control(&app);
}
