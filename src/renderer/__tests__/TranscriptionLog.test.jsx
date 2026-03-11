// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(cleanup);

vi.mock('../lib/ipc', () => ({
  copyToClipboard: vi.fn(),
}));

import TranscriptionLog from '../components/TranscriptionLog.jsx';

describe('TranscriptionLog', () => {
  it('shows placeholder message when empty', () => {
    render(<TranscriptionLog transcriptions={[]} />);
    expect(screen.getByText(/Transcriptions will appear here/)).toBeInTheDocument();
  });

  it('renders one card per entry, no placeholder', () => {
    const time = new Date();
    const entries = [
      { text: 'first', isError: false, time },
      { text: 'second', isError: false, time },
    ];
    render(<TranscriptionLog transcriptions={entries} />);
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText(/Transcriptions will appear here/)).not.toBeInTheDocument();
  });
});
