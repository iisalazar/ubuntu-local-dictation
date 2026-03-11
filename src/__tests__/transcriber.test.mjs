import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTranscriber = vi.fn();
const mockPipeline = vi.fn().mockResolvedValue(mockTranscriber);

vi.mock('@huggingface/transformers', () => ({
  pipeline: mockPipeline,
}));

describe('transcribeLocal', () => {
  beforeEach(() => {
    vi.resetModules();
    mockPipeline.mockClear();
    mockPipeline.mockResolvedValue(mockTranscriber);
    mockTranscriber.mockClear();
  });

  async function loadModule() {
    const mod = await import('../transcriber.mjs');
    return mod.transcribeLocal;
  }

  it('calls pipeline with correct model config', async () => {
    const transcribeLocal = await loadModule();
    mockTranscriber.mockResolvedValue({ text: 'hello' });

    const config = { local: { model: 'Xenova/whisper-small', quantized: false }, language: 'en' };
    await transcribeLocal(new Float32Array([0]), config);

    expect(mockPipeline).toHaveBeenCalledWith(
      'automatic-speech-recognition',
      'Xenova/whisper-small',
      { quantized: false, device: 'cpu' },
    );
  });

  it('passes transcription options to the transcriber', async () => {
    const transcribeLocal = await loadModule();
    mockTranscriber.mockResolvedValue({ text: 'world' });

    const config = { language: 'fr' };
    await transcribeLocal(new Float32Array([0]), config);

    expect(mockTranscriber).toHaveBeenCalledWith(
      expect.any(Float32Array),
      { language: 'fr', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 },
    );
  });

  it('uses defaults for model, language, and quantized', async () => {
    const transcribeLocal = await loadModule();
    mockTranscriber.mockResolvedValue({ text: 'test' });

    await transcribeLocal(new Float32Array([0]), {});

    expect(mockPipeline).toHaveBeenCalledWith(
      'automatic-speech-recognition',
      'Xenova/whisper-base',
      { quantized: true, device: 'cpu' },
    );
    expect(mockTranscriber).toHaveBeenCalledWith(
      expect.any(Float32Array),
      expect.objectContaining({ language: 'en' }),
    );
  });

  it('returns result.text', async () => {
    const transcribeLocal = await loadModule();
    mockTranscriber.mockResolvedValue({ text: 'hello world' });

    const result = await transcribeLocal(new Float32Array([0]), {});
    expect(result).toBe('hello world');
  });

  it('caches pipeline across calls', async () => {
    const transcribeLocal = await loadModule();
    mockTranscriber.mockResolvedValue({ text: 'a' });

    await transcribeLocal(new Float32Array([0]), {});
    await transcribeLocal(new Float32Array([0]), {});

    expect(mockPipeline).toHaveBeenCalledTimes(1);
  });
});
