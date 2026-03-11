import { describe, it, expect } from 'vitest';
const { buildWavBuffer, formatTrayIconSvg } = require('../utils');

describe('buildWavBuffer', () => {
  it('produces correct RIFF header and WAVE format tag', () => {
    const buf = buildWavBuffer(new Float32Array([0]));
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
  });

  it('has correct WAV header fields: PCM, mono, 16kHz, 16-bit', () => {
    const buf = buildWavBuffer(new Float32Array([0]));
    expect(buf.readUInt16LE(20)).toBe(1);     // PCM format
    expect(buf.readUInt16LE(22)).toBe(1);     // mono
    expect(buf.readUInt32LE(24)).toBe(16000); // sample rate
    expect(buf.readUInt32LE(28)).toBe(32000); // byte rate
    expect(buf.readUInt16LE(32)).toBe(2);     // block align
    expect(buf.readUInt16LE(34)).toBe(16);    // bits per sample
  });

  it('has correct total length: 44 + samples * 2', () => {
    const samples = new Float32Array(100);
    const buf = buildWavBuffer(samples);
    expect(buf.length).toBe(44 + 100 * 2);
  });

  it('has correct RIFF chunk size and data chunk size', () => {
    const samples = new Float32Array(50);
    const buf = buildWavBuffer(samples);
    const dataSize = 50 * 2;
    expect(buf.readUInt32LE(4)).toBe(36 + dataSize);  // RIFF chunk size
    expect(buf.toString('ascii', 36, 40)).toBe('data');
    expect(buf.readUInt32LE(40)).toBe(dataSize);       // data chunk size
  });

  it('converts float to int16 correctly', () => {
    const samples = new Float32Array([1.0, -1.0, 0]);
    const buf = buildWavBuffer(samples);
    expect(buf.readInt16LE(44)).toBe(32767);
    expect(buf.readInt16LE(46)).toBe(-32767); // Math.round(-1.0 * 32767)
    expect(buf.readInt16LE(48)).toBe(0);
  });

  it('clamps values beyond ±1.0', () => {
    const samples = new Float32Array([1.5, -1.5]);
    const buf = buildWavBuffer(samples);
    expect(buf.readInt16LE(44)).toBe(32767);
    expect(buf.readInt16LE(46)).toBe(-32768);
  });

  it('produces 44-byte header-only WAV for empty input', () => {
    const buf = buildWavBuffer(new Float32Array(0));
    expect(buf.length).toBe(44);
    expect(buf.readUInt32LE(40)).toBe(0); // data chunk size
  });
});

describe('formatTrayIconSvg', () => {
  it('returns SVG string with correct viewBox', () => {
    const svg = formatTrayIconSvg('#ff0000');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 22 22"');
  });

  it('includes the passed color in a fill attribute', () => {
    const svg = formatTrayIconSvg('#abcdef');
    expect(svg).toContain('fill="#abcdef"');
  });

  it('contains microphone elements', () => {
    const svg = formatTrayIconSvg('#000');
    expect(svg).toContain('<rect');
    expect(svg).toContain('<path');
    expect(svg).toContain('<line');
  });
});
