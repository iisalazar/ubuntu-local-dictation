# Local Dictation

A local-first dictation app for Linux, macOS, and Windows. Press a global hotkey to record speech, transcribe it locally using [Whisper](https://huggingface.co/Xenova/whisper-base) (via HuggingFace Transformers.js), and paste the result into any application. No cloud required — but optionally supports the OpenAI Whisper API for cloud transcription.

Built with Electron + React.

<video src="demos/demo1.webm" controls width="600"></video>

## Features

- **Local-first** — transcription runs entirely on your machine via Whisper (no internet needed)
- **Cloud mode** — optionally use OpenAI's Whisper API for faster/more accurate results
- **Global hotkey** — press `Ctrl+Shift+D` (configurable) from any app to start/stop recording
- **Auto-paste** — transcribed text is automatically pasted into the focused application
- **System tray** — runs quietly in the background with a tray icon
- **Cross-platform** — Linux (AppImage, deb), macOS (dmg), Windows (installer)
- **Dark UI** — clean transcription history log with copy buttons

## Installation

### From releases

Download the latest build for your platform from the [Releases](../../releases) page.

### From source

```bash
git clone https://github.com/iisalazar/local-dictation.git
cd local-dictation
npm install
npm start
```

## Usage

1. Launch the app — it appears in your system tray
2. Press **Ctrl+Shift+D** (or your configured hotkey) to start recording
3. Speak, then press the hotkey again to stop
4. The transcription is automatically pasted into your focused application

## Configuration

Edit `config.json` in the project root:

```json
{
  "mode": "local",
  "language": "en",
  "hotkey": "Ctrl+Shift+D",
  "local": {
    "model": "Xenova/whisper-base",
    "quantized": true
  },
  "cloud": {
    "apiKey": ""
  },
  "output": {
    "method": "clipboard"
  }
}
```

| Option | Description |
|--------|-------------|
| `mode` | `"local"` for on-device Whisper, `"cloud"` for OpenAI API |
| `language` | Language code (e.g. `"en"`, `"es"`, `"fr"`) |
| `hotkey` | Global keyboard shortcut |
| `local.model` | HuggingFace model ID for local transcription |
| `cloud.apiKey` | OpenAI API key (or set `OPENAI_API_KEY` env var) |

## Development

```bash
# Start in dev mode (Vite HMR + Electron)
npm run dev

# Run tests
npm test
```

## Building

```bash
# Build for current platform
npm run build

# Platform-specific
npm run build:linux    # AppImage + deb
npm run build:mac      # dmg
npm run build:win      # nsis installer
```

### Releasing

Push a version tag to trigger the GitHub Actions release workflow:

```bash
git tag v1.0.0
git push --tags
```

This creates a draft release with builds for all platforms.

## License

[MIT](LICENSE)
