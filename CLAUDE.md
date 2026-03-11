# Local Dictation

Electron-based local-first dictation app. Press a hotkey to record speech, transcribes via local Whisper (HuggingFace transformers.js) or OpenAI cloud API, and pastes the result.

## Architecture

- `src/main.js` — Electron main process: tray icon, global shortcuts, clipboard/paste, cloud transcription, IPC hub
- `src/renderer.html` — Hidden renderer: mic recording via Web Audio API, decodes to 16kHz float32 PCM, sends to main via IPC
- `src/transcriber.mjs` — ESM module for local Whisper transcription using `@huggingface/transformers`
- `config.json` — User config: hotkey, mode (local/cloud), model, language

## Key patterns

- Renderer only handles audio capture + decode. All transcription runs in main process.
- Local transcription uses dynamic `import()` of the .mjs file since `@huggingface/transformers` is ESM-only.
- PCM data sent over IPC as plain Array (Float32Array doesn't serialize).
- Paste simulation: clipboard write + xdotool/ydotool (Linux), osascript (macOS), SendKeys (Windows). Falls back to notification if unavailable.

## Commands

- `npm start` — Run the app
- `npm install` — Install dependencies

## Config

Edit `config.json`. Set `OPENAI_API_KEY` env var or `cloud.apiKey` for cloud mode.
