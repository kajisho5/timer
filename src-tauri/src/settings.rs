use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Style {
    pub font: String,
    pub size: u32,
    pub bg: String,
    pub fg: String,
}

impl Default for Style {
    fn default() -> Self {
        Style { font: "System".into(), size: 30, bg: "#ffffff".into(), fg: "#5f2758".into() }
    }
}

fn path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_data_dir().ok().map(|d| d.join("settings.json"))
}

/// 保存済みの外観を読む。無い・壊れている場合は初期値。
pub fn load(app: &AppHandle) -> Style {
    path(app)
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str::<Style>(&s).ok())
        .map(sanitize)
        .unwrap_or_default()
}

pub fn save(app: &AppHandle, style: &Style) {
    if let Some(p) = path(app) {
        if let Some(dir) = p.parent() {
            let _ = fs::create_dir_all(dir);
        }
        if let Ok(s) = serde_json::to_string_pretty(style) {
            let _ = fs::write(p, s);
        }
    }
}

pub fn sanitize(mut s: Style) -> Style {
    s.size = s.size.clamp(4, 60);
    let ok_color = |c: &str| c.len() == 7 && c.starts_with('#') && c[1..].chars().all(|x| x.is_ascii_hexdigit());
    let d = Style::default();
    if !ok_color(&s.bg) { s.bg = d.bg; }
    if !ok_color(&s.fg) { s.fg = d.fg; }
    s
}
