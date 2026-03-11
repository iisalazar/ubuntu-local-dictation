function buildWavBuffer(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
  }

  const wavHeader = Buffer.alloc(44);
  const dataSize = int16.length * 2;
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + dataSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);       // PCM
  wavHeader.writeUInt16LE(1, 22);       // mono
  wavHeader.writeUInt32LE(16000, 24);   // sample rate
  wavHeader.writeUInt32LE(32000, 28);   // byte rate
  wavHeader.writeUInt16LE(2, 32);       // block align
  wavHeader.writeUInt16LE(16, 34);      // bits per sample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  return Buffer.concat([wavHeader, Buffer.from(int16.buffer)]);
}

function formatTrayIconSvg(color) {
  const size = 22;
  return `<svg width="${size}" height="${size}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" fill="${color}"/>
    <rect x="9" y="4" width="4" height="10" rx="2" fill="white"/>
    <path d="M6 11 a5 5 0 0 0 10 0" stroke="white" stroke-width="1.5" fill="none"/>
    <line x1="11" y1="16" x2="11" y2="19" stroke="white" stroke-width="1.5"/>
  </svg>`;
}

module.exports = { buildWavBuffer, formatTrayIconSvg };
