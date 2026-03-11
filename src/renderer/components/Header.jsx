const STATUS_LABELS = {
  ready: 'Ready',
  recording: 'Recording...',
  transcribing: 'Transcribing...',
};

export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Header({ config, status, secondsLeft }) {
  return (
    <header>
      <div className="header-left">
        <span className="app-title">Local Dictation</span>
        <div className="status">
          <span className={`status-dot ${status}`} />
          <span>{STATUS_LABELS[status] || status}</span>
          {status === 'recording' && secondsLeft > 0 && (
            <span className="timer">{formatTime(secondsLeft)}</span>
          )}
        </div>
      </div>
      <div className="badges">
        <span className="badge">{config.hotkey || 'Super+Shift+D'}</span>
        <span className="badge">{config.mode}</span>
      </div>
    </header>
  );
}
