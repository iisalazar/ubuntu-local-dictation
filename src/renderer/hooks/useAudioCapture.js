import { useEffect, useRef } from 'react';
import { onIpc, sendIpc } from '../lib/ipc';

const path = window.require('path');
const fs = window.require('fs');
const os = window.require('os');

export function useAudioCapture() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const cleanups = [];

    cleanups.push(onIpc('start-recording', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
          }
        });

        chunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        recorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          const arrayBuffer = await blob.arrayBuffer();
          const ctx = new AudioContext({ sampleRate: 16000 });
          try {
            const audioData = await ctx.decodeAudioData(arrayBuffer);
            const float32 = audioData.getChannelData(0);
            // Write PCM to temp file to avoid large IPC serialization
            const tmpFile = path.join(os.tmpdir(), `dictation-${Date.now()}.pcm`);
            fs.writeFileSync(tmpFile, Buffer.from(float32.buffer));
            sendIpc('audio-pcm-file', tmpFile, float32.length);
          } catch (err) {
            sendIpc('transcription-error', 'Failed to decode audio: ' + err.message);
          } finally {
            ctx.close();
          }
        };

        recorder.start(100);
        console.log('Recording started');
      } catch (err) {
        console.error('Mic access error:', err);
        sendIpc('transcription-error', 'Mic error: ' + err.message);
      }
    }));

    cleanups.push(onIpc('stop-recording', () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
        console.log('Recording stopped');
      }
    }));

    return () => cleanups.forEach(fn => fn());
  }, []);
}
