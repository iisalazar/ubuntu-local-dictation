# Local Dictation

Electron-based local-first dictation app. Press a hotkey to record speech, transcribes via local Whisper (HuggingFace transformers.js) or OpenAI cloud API, and pastes the result.

## Architecture

- `src/main.js` — Electron main process: tray icon, window management, global shortcuts, clipboard/paste, cloud transcription, IPC hub
- `src/renderer.html` — Visible UI with transcription history log + mic recording via Web Audio API, decodes to 16kHz float32 PCM
- `src/transcriber.mjs` — ESM module for local Whisper transcription using `@huggingface/transformers`
- `config.json` — User config: hotkey, mode (local/cloud), model, language

## Key patterns

- Renderer handles both audio capture and UI display. All transcription runs in main process.
- Local transcription uses dynamic `import()` of the .mjs file since `@huggingface/transformers` is ESM-only.
- PCM data sent over IPC as plain Array (Float32Array doesn't serialize).
- Paste simulation: clipboard write + xdotool/ydotool (Linux), osascript (macOS), SendKeys (Windows). Falls back to notification if unavailable.
- Window hides on close, restores via tray click or "Show Window" menu item.

## IPC channels

- `start-recording` / `stop-recording` — main → renderer: control mic recording
- `audio-pcm` — renderer → main: decoded audio samples
- `config` — main → renderer: send config on load
- `status-change` — main → renderer: `'ready'` / `'recording'` / `'transcribing'`
- `transcription-text` — main → renderer: successful transcription result
- `transcription-error` — bidirectional: error messages

## Commands

- `npm start` — Run the app
- `npm install` — Install dependencies
- `npm run build` — Build for current platform
- `npm run build:linux` — Build AppImage + deb
- `npm run build:mac` — Build dmg
- `npm run build:win` — Build nsis installer

## Config

Edit `config.json`. Set `OPENAI_API_KEY` env var or `cloud.apiKey` for cloud mode.
