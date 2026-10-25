mod settings;
mod timer;
mod windows;

use tauri::{Manager, WindowEvent};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let style = settings::load(app.handle());
            app.manage(timer::Timer::new(style));
            timer::spawn_ticker(app.handle().clone());
            // 起動3秒後（スプラッシュが終わってから）にコントロール窓を自動で開く
            let h = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(3000));
                windows::open_control(&h);
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Destroyed = event {
                match window.label() {
                    // 表示窓を閉じたらアプリごと終了（操作不能な窓を残さない）
                    "main" => window.app_handle().exit(0),
                    "control" => windows::control_closed(window.app_handle()),
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            timer::get_state,
            timer::start,
            timer::stop,
            timer::reset,
            timer::set_time,
            timer::set_preset,
            timer::set_style,
            timer::flash,
            windows::open_control_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("LEQVIO TIMER の起動に失敗しました");
}
