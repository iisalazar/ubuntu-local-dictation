import { OpenAI, AzureOpenAI } from 'openai';
import { buildWavBuffer } from './utils.js';

export async function transcribeCloud(float32, config) {
  const wavBuffer = buildWavBuffer(float32);
  const file = new File([wavBuffer], 'audio.wav', { type: 'audio/wav' });

  let client, model;
  if (config.cloud.provider === 'azure-foundry') {
    const azure = config.cloud.azure || {};
    client = new AzureOpenAI({
      apiKey: config.cloud.apiKey || process.env.AZURE_FOUNDRY_API_KEY,
      endpoint: azure.endpoint,
      apiVersion: azure.apiVersion || '2024-06-01',
      deployment: azure.deployment,
    });
    model = azure.deployment;
  } else {
    client = new OpenAI({ apiKey: config.cloud.apiKey || process.env.OPENAI_API_KEY });
    model = 'whisper-1';
  }

  const result = await client.audio.transcriptions.create({ model, file });
  return result.text;
}
