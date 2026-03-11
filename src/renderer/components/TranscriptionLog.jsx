import { useEffect, useRef } from 'react';
import TranscriptionCard from './TranscriptionCard';

export default function TranscriptionLog({ transcriptions }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [transcriptions.length]);

  return (
    <div className="log" ref={logRef}>
      {transcriptions.length === 0 ? (
        <div className="log-empty">
          {'Transcriptions will appear here.\nPress your hotkey to start recording.'}
        </div>
      ) : (
        transcriptions.map((entry, i) => (
          <TranscriptionCard key={i} {...entry} />
        ))
      )}
    </div>
  );
}
