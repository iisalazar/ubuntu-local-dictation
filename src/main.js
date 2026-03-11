const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, nativeImage } = require('electron');
app.commandLine.appendSwitch('no-sandbox');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

let config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
let tray = null;
let win = null;
let recording = false;
let processing = false;
let recordingTimer = null;
const MAX_RECORDING_MS = 3 * 60 * 1000; // 3 minutes

function createTrayIcon(color) {
  const size = 22;
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" fill="${color}"/>
    <rect x="9" y="4" width="4" height="10" rx="2" fill="white"/>
    <path d="M6 11 a5 5 0 0 0 10 0" stroke="white" stroke-width="1.5" fill="none"/>
    <line x1="11" y1="16" x2="11" y2="19" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return nativeImage.createFromBuffer(Buffer.from(canvas));
}

const ICON_IDLE = createTrayIcon('#666666');
const ICON_RECORDING = createTrayIcon('#cc3333');
const ICON_PROCESSING = createTrayIcon('#cc9933');

function sendStatus(status) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('status-change', status);
  }
}

function updateTray() {
  if (!tray) return;
  if (processing) {
    tray.setImage(ICON_PROCESSING);
    tray.setToolTip('Dictation: transcribing...');
    sendStatus('transcribing');
  } else if (recording) {
    tray.setImage(ICON_RECORDING);
    tray.setToolTip('Dictation: recording...');
    sendStatus('recording');
  } else {
    tray.setImage(ICON_IDLE);
    tray.setToolTip('Dictation: ready');
    sendStatus('ready');
  }
  updateContextMenu();
}

function updateContextMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => { win.show(); win.focus(); } },
    { label: `Mode: ${config.mode}`, click: () => {
      config.mode = config.mode === 'local' ? 'cloud' : 'local';
      console.log(`Switched to ${config.mode} mode`);
      updateContextMenu();
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
}

function toggleRecording() {
  if (processing) return;
  if (recording) {
    clearTimeout(recordingTimer);
    recordingTimer = null;
    recording = false;
    processing = true;
    updateTray();
    console.log('Recording stopped. Transcribing...');
    win.webContents.send('stop-recording');
  } else {
    recording = true;
    updateTray();
    console.log('Recording started...');
    win.webContents.send('start-recording');
    // Auto-stop after max duration
    recordingTimer = setTimeout(() => {
      if (recording) {
        console.log('Max recording duration reached, auto-stopping...');
        toggleRecording();
      }
    }, MAX_RECORDING_MS);
  }
}

// Renderer sends PCM file path to avoid large IPC serialization
ipcMain.on('audio-pcm-file', async (_event, filePath, sampleCount) => {
  console.log(`Received ${sampleCount} samples (${(sampleCount / 16000).toFixed(1)}s) from ${filePath}`);

  try {
    const pcmBuffer = fs.readFileSync(filePath);
    const float32 = new Float32Array(pcmBuffer.buffer, pcmBuffer.byteOffset, sampleCount);
    // Clean up temp file
    fs.unlink(filePath, () => {});

    let text;
    if (config.mode === 'cloud') {
      text = await transcribeCloud(float32);
    } else {
      const { transcribeLocal } = await import('./transcriber.mjs');
      text = await transcribeLocal(float32, config);
    }

    if (text && text.trim()) {
      console.log(`Transcribed: ${text}`);
      win.webContents.send('transcription-text', text.trim());
      typeText(text.trim());
    } else {
      console.log('No speech detected.');
    }
  } catch (err) {
    console.error('Transcription error:', err);
    win.webContents.send('transcription-error', err.message || String(err));
  } finally {
    processing = false;
    updateTray();
  }
});

ipcMain.on('transcription-error', (_event, err) => {
  console.error('Transcription error:', err);
  win.webContents.send('transcription-error', err);
  processing = false;
  updateTray();
});

async function transcribeCloud(float32) {
  const OpenAI = require('openai');
  const apiKey = config.cloud.apiKey || process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey });

  // Convert float32 PCM to 16-bit WAV
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
  }

  const wavHeader = Buffer.alloc(44);
  const dataSize = int16.length * 2;
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + dataSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);       // PCM
  wavHeader.writeUInt16LE(1, 22);       // mono
  wavHeader.writeUInt32LE(16000, 24);   // sample rate
  wavHeader.writeUInt32LE(32000, 28);   // byte rate
  wavHeader.writeUInt16LE(2, 32);       // block align
  wavHeader.writeUInt16LE(16, 34);      // bits per sample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([wavHeader, Buffer.from(int16.buffer)]);
  const file = new File([wavBuffer], 'audio.wav', { type: 'audio/wav' });

  const result = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file,
  });
  return result.text;
}

function typeText(text) {
  clipboard.writeText(text);
  // Brief delay to ensure clipboard is set before simulating paste
  setTimeout(() => {
    const { execSync, execFileSync } = require('child_process');
    const plat = process.platform;
    try {
      if (plat === 'linux') {
        // Try ydotool (Wayland+X11), then xdotool (X11), then notify
        try {
          execFileSync('ydotool', ['key', '29:1', '47:1', '47:0', '29:0']); // ctrl+v
        } catch {
          execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+v']);
        }
      } else if (plat === 'darwin') {
        execSync('osascript -e \'tell application "System Events" to keystroke "v" using command down\'');
      } else if (plat === 'win32') {
        execSync('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"');
      }
    } catch (err) {
      const { Notification } = require('electron');
      new Notification({
        title: 'Dictation',
        body: 'Text copied to clipboard — paste with Ctrl+V',
      }).show();
    }
  }, 100);
}

function createWindow() {
  win = new BrowserWindow({
    show: true,
    width: 420,
    height: 600,
    minWidth: 320,
    minHeight: 400,
    title: 'Local Dictation',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    win.loadURL('http://localhost:5173/');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }
  win.on('close', (e) => {
    e.preventDefault();
    win.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  tray = new Tray(ICON_IDLE);
  tray.setToolTip('Dictation: ready');
  updateContextMenu();

  tray.on('click', () => {
    win.show();
    win.focus();
  });

  // Register global shortcut
  const hotkey = config.hotkey || 'Super+Shift+D';
  const registered = globalShortcut.register(hotkey, toggleRecording);
  if (!registered) {
    console.error(`Failed to register hotkey: ${hotkey}`);
  } else {
    console.log(`Dictation ready. Press ${hotkey} to toggle recording.`);
    console.log(`Mode: ${config.mode}`);
  }

  // Send config to renderer once it's ready
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('config', config);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  // Keep app running in tray
  e.preventDefault?.();
});
