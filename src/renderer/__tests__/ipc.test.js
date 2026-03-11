// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIpcRenderer = {
  on: vi.fn(),
  removeListener: vi.fn(),
  send: vi.fn(),
};
const mockClipboard = {
  writeText: vi.fn(),
};

vi.stubGlobal('window', {
  ...globalThis.window,
  require: vi.fn((mod) => {
    if (mod === 'electron') return { ipcRenderer: mockIpcRenderer, clipboard: mockClipboard };
    throw new Error(`Unexpected require: ${mod}`);
  }),
});

const { onIpc, sendIpc, copyToClipboard } = await import('../lib/ipc.js');

describe('onIpc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers listener on channel and cleanup removes it', () => {
    const handler = vi.fn();
    const cleanup = onIpc('test-channel', handler);

    expect(mockIpcRenderer.on).toHaveBeenCalledWith('test-channel', expect.any(Function));

    cleanup();
    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('test-channel', expect.any(Function));
  });

  it('handler receives args without the _event parameter', () => {
    const handler = vi.fn();
    onIpc('ch', handler);

    const wrapper = mockIpcRenderer.on.mock.calls[0][1];
    wrapper({/* event */}, 'arg1', 'arg2');

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('sendIpc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forwards to ipcRenderer.send', () => {
    sendIpc('my-channel', 'data1', 'data2');
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('my-channel', 'data1', 'data2');
  });
});

describe('copyToClipboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forwards to clipboard.writeText', () => {
    copyToClipboard('hello');
    expect(mockClipboard.writeText).toHaveBeenCalledWith('hello');
  });
});
