use crate::settings::{self, Style};
use serde::Serialize;
use std::{sync::Mutex, time::{Duration, Instant}};
use tauri::{AppHandle, Emitter, Manager, State};

struct Inner {
    total: i64,
    remaining: i64, // 0を過ぎるとマイナス＝超過
    running: bool,
    started: Option<Instant>,
    base: i64,
    style: Style,
    linked: bool,
}

pub struct Timer(Mutex<Inner>);

#[derive(Clone, Serialize)]
pub struct Snapshot {
    remaining: i64,
    total: i64,
    running: bool,
    overrun: bool,
    linked: bool,
    style: Style,
}

impl Timer {
    pub fn new(style: Style) -> Self {
        Timer(Mutex::new(Inner {
            total: 0, remaining: 0, running: false, started: None, base: 0, style, linked: false,
        }))
    }
}

fn snapshot(i: &Inner) -> Snapshot {
    Snapshot {
        remaining: i.remaining, total: i.total, running: i.running,
        overrun: i.remaining < 0, linked: i.linked, style: i.style.clone(),
    }
}

fn broadcast(app: &AppHandle, s: Snapshot) {
    let _ = app.emit("timer-state", s);
}

/// 窓から「コントロールが開いているか」を更新する
pub fn set_linked(app: &AppHandle, linked: bool) {
    let t = app.state::<Timer>();
    let s = {
        let mut i = t.0.lock().unwrap();
        i.linked = linked;
        snapshot(&i)
    };
    broadcast(app, s);
}

/// 200msごとに残り時間を実時刻から計算。値が変わったときだけ両窓へ通知。
/// （実時刻ベースなので長時間でもズレが積み重ならない）
pub fn spawn_ticker(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(200));
        let t = app.state::<Timer>();
        let s = {
            let mut i = t.0.lock().unwrap();
            if !i.running { continue; }
            let Some(st) = i.started else { continue };
            let next = i.base - st.elapsed().as_secs() as i64;
            if next == i.remaining { continue; }
            i.remaining = next;
            snapshot(&i)
        };
        broadcast(&app, s);
    });
}

fn with<F: FnOnce(&mut Inner)>(app: &AppHandle, t: &State<Timer>, f: F) {
    let s = {
        let mut i = t.0.lock().unwrap();
        f(&mut i);
        snapshot(&i)
    };
    broadcast(app, s);
}

#[tauri::command]
pub fn get_state(t: State<Timer>) -> Snapshot {
    snapshot(&t.0.lock().unwrap())
}

#[tauri::command]
pub fn start(app: AppHandle, t: State<Timer>) {
    let _ = app.emit("flash", "start");
    with(&app, &t, |i| {
        if i.running { return; }
        i.running = true;
        i.started = Some(Instant::now());
        i.base = i.remaining;
    });
}

#[tauri::command]
pub fn stop(app: AppHandle, t: State<Timer>) {
    let _ = app.emit("flash", "stop");
    with(&app, &t, |i| { i.running = false; i.started = None; });
}

#[tauri::command]
pub fn reset(app: AppHandle, t: State<Timer>) {
    let _ = app.emit("flash", "reset");
    with(&app, &t, |i| { i.running = false; i.started = None; i.remaining = i.total; });
}

/// 動作中は時間をセットできない
#[tauri::command]
pub fn set_time(app: AppHandle, t: State<Timer>, sec: i64) {
    with(&app, &t, |i| {
        if i.running { return; }
        let sec = sec.clamp(0, 6039); // 99分99秒まで
        i.total = sec; i.remaining = sec;
    });
}

/// プリセットは動作中でも停止してセットする
#[tauri::command]
pub fn set_preset(app: AppHandle, t: State<Timer>, sec: i64) {
    with(&app, &t, |i| {
        i.running = false; i.started = None;
        let sec = sec.clamp(0, 6039);
        i.total = sec; i.remaining = sec;
    });
}

#[tauri::command]
pub fn set_style(app: AppHandle, t: State<Timer>, style: Style) {
    let style = settings::sanitize(style);
    settings::save(&app, &style);
    with(&app, &t, |i| i.style = style);
}

#[tauri::command]
pub fn flash(app: AppHandle, name: String) {
    if matches!(name.as_str(), "start" | "stop" | "reset" | "set") {
        let _ = app.emit("flash", name);
    }
}
