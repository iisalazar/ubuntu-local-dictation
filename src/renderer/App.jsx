import { useState, useEffect, useRef } from 'react';
import { onIpc } from './lib/ipc';
import { useAudioCapture } from './hooks/useAudioCapture';
import Header from './components/Header';
import TranscriptionLog from './components/TranscriptionLog';
import Toast from './components/Toast';
import './styles/index.css';

const MAX_RECORDING_SECS = 3 * 60;

export default function App() {
  const [config, setConfig] = useState({ hotkey: '...', mode: '...' });
  const [status, setStatus] = useState('ready');
  const [transcriptions, setTranscriptions] = useState([]);
  const [toast, setToast] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  useAudioCapture();

  useEffect(() => {
    const cleanups = [
      onIpc('config', (cfg) => setConfig(cfg)),
      onIpc('status-change', (s) => setStatus(s)),
      onIpc('transcription-text', (text) => {
        setTranscriptions(prev => [...prev, { text, isError: false, time: new Date() }]);
        setToast('Transcription complete \u2014 text pasted. Click Copy on the card to copy again.');
      }),
      onIpc('transcription-error', (msg) => {
        setTranscriptions(prev => [...prev, { text: msg, isError: true, time: new Date() }]);
      }),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // Countdown timer when recording
  useEffect(() => {
    if (status === 'recording') {
      setSecondsLeft(MAX_RECORDING_SECS);
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setSecondsLeft(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  return (
    <>
      <Header config={config} status={status} secondsLeft={secondsLeft} />
      <TranscriptionLog transcriptions={transcriptions} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
