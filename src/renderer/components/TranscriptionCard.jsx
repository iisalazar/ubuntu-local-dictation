import { useState } from 'react';
import { copyToClipboard } from '../lib/ipc';

export default function TranscriptionCard({ text, isError, time }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`card${isError ? ' error' : ''}`}>
      <div className="card-time">{time.toLocaleTimeString()}</div>
      <div className="card-text">{text}</div>
      {!isError && (
        <button className="card-copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  );
}
