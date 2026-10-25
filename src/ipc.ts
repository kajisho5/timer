import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { FlashName, Snapshot, Style } from './types';

export const getState = () => invoke<Snapshot>('get_state');
export const start = () => invoke('start');
export const stop = () => invoke('stop');
export const reset = () => invoke('reset');
export const setTime = (sec: number) => invoke('set_time', { sec });
export const setPreset = (sec: number) => invoke('set_preset', { sec });
export const setStyle = (style: Style) => invoke('set_style', { style });
export const flash = (name: FlashName) => invoke('flash', { name });
export const openControl = () => invoke("open_control_cmd");

export const onState = (fn: (s: Snapshot) => void) =>
  listen<Snapshot>('timer-state', e => fn(e.payload));
export const onFlash = (fn: (n: FlashName) => void) =>
  listen<FlashName>('flash', e => fn(e.payload));
