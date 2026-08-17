import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const MockOpenAI = vi.fn().mockImplementation(function () {
  return { audio: { transcriptions: { create: mockCreate } } };
});
const MockAzureOpenAI = vi.fn().mockImplementation(function () {
  return { audio: { transcriptions: { create: mockCreate } } };
});

vi.mock('openai', () => ({
  OpenAI: MockOpenAI,
  AzureOpenAI: MockAzureOpenAI,
}));

describe('transcribeCloud', () => {
  beforeEach(() => {
    vi.resetModules();
    MockOpenAI.mockClear();
    MockAzureOpenAI.mockClear();
    mockCreate.mockReset();
  });

  async function loadModule() {
    const mod = await import('../cloudTranscriber.mjs');
    return mod.transcribeCloud;
  }

  it('defaults to the OpenAI provider with whisper-1', async () => {
    const transcribeCloud = await loadModule();
    mockCreate.mockResolvedValue({ text: 'hello' });
    const config = { cloud: { apiKey: 'sk-test' } };

    const result = await transcribeCloud(new Float32Array([0]), config);

    expect(MockOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test' });
    expect(MockAzureOpenAI).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'whisper-1' }));
    expect(result).toBe('hello');
  });

  it('falls back to OPENAI_API_KEY env var when cloud.apiKey is empty', async () => {
    const transcribeCloud = await loadModule();
    mockCreate.mockResolvedValue({ text: 'hi' });
    process.env.OPENAI_API_KEY = 'env-key';
    const config = { cloud: { apiKey: '' } };

    await transcribeCloud(new Float32Array([0]), config);

    expect(MockOpenAI).toHaveBeenCalledWith({ apiKey: 'env-key' });
    delete process.env.OPENAI_API_KEY;
  });

  it('uses AzureOpenAI when provider is azure-foundry', async () => {
    const transcribeCloud = await loadModule();
    mockCreate.mockResolvedValue({ text: 'world' });
    const config = {
      cloud: {
        provider: 'azure-foundry',
        apiKey: 'azure-key',
        azure: {
          endpoint: 'https://example.services.ai.azure.com',
          deployment: 'my-whisper',
          apiVersion: '2024-08-01',
        },
      },
    };

    const result = await transcribeCloud(new Float32Array([0]), config);

    expect(MockAzureOpenAI).toHaveBeenCalledWith({
      apiKey: 'azure-key',
      endpoint: 'https://example.services.ai.azure.com',
      apiVersion: '2024-08-01',
      deployment: 'my-whisper',
    });
    expect(MockOpenAI).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'my-whisper' }));
    expect(result).toBe('world');
  });

  it('defaults azure apiVersion to 2024-06-01 when unset', async () => {
    const transcribeCloud = await loadModule();
    mockCreate.mockResolvedValue({ text: 'x' });
    const config = {
      cloud: { provider: 'azure-foundry', apiKey: 'k', azure: { endpoint: 'e', deployment: 'd' } },
    };

    await transcribeCloud(new Float32Array([0]), config);

    expect(MockAzureOpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiVersion: '2024-06-01' }));
  });
});
