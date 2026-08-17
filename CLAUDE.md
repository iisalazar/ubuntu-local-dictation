# Local Dictation

Electron-based local-first dictation app. Press a hotkey to record speech, transcribes via local Whisper (HuggingFace transformers.js) or a cloud API (OpenAI or Azure AI Foundry), and pastes the result.

## Architecture

- `src/main.js` — Electron main process: tray icon, window management, global shortcuts, clipboard/paste, cloud transcription, IPC hub
- `src/renderer/` — React UI (built with Vite), transcription history log + mic recording via Web Audio API
  - `App.jsx` — root component, state management, IPC subscriptions
  - `components/Header.jsx` — status dot, hotkey/mode badges
  - `components/TranscriptionLog.jsx` — scrollable card list with auto-scroll
  - `components/TranscriptionCard.jsx` — individual card with copy button
  - `components/Toast.jsx` — auto-dismiss toast notification
  - `hooks/useAudioCapture.js` — MediaRecorder + AudioContext, decodes to 16kHz float32 PCM
  - `lib/ipc.js` — wrapper around `window.require('electron')` for ipcRenderer/clipboard
  - `styles/index.css` — dark theme styles
- `src/transcriber.mjs` — ESM module for local Whisper transcription using `@huggingface/transformers`
- `src/cloudTranscriber.mjs` — ESM module for cloud transcription, branches on `config.cloud.provider` between OpenAI (`whisper-1`) and Azure AI Foundry (`AzureOpenAI` client) via the `openai` SDK
- `config.json` — User config: hotkey, mode (local/cloud), model, language, cloud provider settings
- `vite.config.js` — Vite config for building the renderer
- `.github/workflows/release.yml` — GitHub Actions CI/CD for cross-platform releases

## Key patterns

- Renderer handles both audio capture and UI display. All transcription runs in main process.
- React renderer uses `window.require('electron')` to access ipcRenderer (nodeIntegration: true, no contextIsolation).
- Local and cloud transcription both use dynamic `import()` of their `.mjs` files (`transcriber.mjs`, `cloudTranscriber.mjs`) from the CJS main process.
- PCM data sent over IPC as plain Array (Float32Array doesn't serialize).
- Paste simulation: clipboard write + xdotool/ydotool (Linux), osascript (macOS), SendKeys (Windows). Falls back to notification if unavailable.
- Window hides on close, restores via tray click or "Show Window" menu item.
- Dev mode (`npm run dev`): Vite dev server on :5173, Electron loads URL. Production (`npm start`): builds renderer first, loads from `dist-renderer/`.

## IPC channels

- `start-recording` / `stop-recording` — main → renderer: control mic recording
- `audio-pcm` — renderer → main: decoded audio samples
- `config` — main → renderer: send config on load
- `status-change` — main → renderer: `'ready'` / `'recording'` / `'transcribing'`
- `transcription-text` — main → renderer: successful transcription result
- `transcription-error` — bidirectional: error messages

## Commands

- `npm run dev` — Run in dev mode (Vite HMR + Electron)
- `npm start` — Build renderer and run the app
- `npm install` — Install dependencies
- `npm run build` — Build for current platform
- `npm run build:linux` — Build AppImage + deb
- `npm run build:mac` — Build dmg
- `npm run build:win` — Build nsis installer

## Releasing

Push a version tag to trigger GitHub Actions:
```
git tag v1.0.0 && git push --tags
```
Creates a draft release with Linux, macOS, and Windows builds.

## Config

Edit `config.json`. For cloud mode, set `cloud.provider` to `"openai"` (default) or `"azure-foundry"`:
- `openai`: set `OPENAI_API_KEY` env var or `cloud.apiKey`. Uses `whisper-1`.
- `azure-foundry`: set `AZURE_FOUNDRY_API_KEY` env var or `cloud.apiKey`, plus `cloud.azure.endpoint` and `cloud.azure.deployment` (the Whisper model deployment name in your Azure AI Foundry project). `cloud.azure.apiVersion` defaults to `2024-06-01`.
