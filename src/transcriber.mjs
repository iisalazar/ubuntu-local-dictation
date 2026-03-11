import { pipeline } from '@huggingface/transformers';

let transcriber = null;
let loading = false;

export async function transcribeLocal(float32Array, config) {
  if (!transcriber) {
    if (loading) {
      while (loading) await new Promise(r => setTimeout(r, 200));
    } else {
      loading = true;
      console.log('Loading whisper model...');
      const model = config.local?.model || 'Xenova/whisper-base';
      const quantized = config.local?.quantized !== false;
      transcriber = await pipeline('automatic-speech-recognition', model, {
        quantized,
        device: 'cpu',
      });
      loading = false;
      console.log('Model loaded.');
    }
  }

  const result = await transcriber(float32Array, {
    language: config.language || 'en',
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  return result.text;
}
