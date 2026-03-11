// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../lib/ipc', () => ({
  copyToClipboard: vi.fn(),
}));

import TranscriptionCard from '../components/TranscriptionCard.jsx';
import { copyToClipboard } from '../lib/ipc';

const time = new Date('2025-01-01T12:00:00');

describe('TranscriptionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders text and timestamp', () => {
    render(<TranscriptionCard text="hello world" isError={false} time={time} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText(time.toLocaleTimeString())).toBeInTheDocument();
  });

  it('shows Copy button for non-error cards', () => {
    render(<TranscriptionCard text="test" isError={false} time={time} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('hides Copy button for error cards', () => {
    render(<TranscriptionCard text="err" isError={true} time={time} />);
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('error card has .error class', () => {
    const { container } = render(<TranscriptionCard text="err" isError={true} time={time} />);
    expect(container.querySelector('.card')).toHaveClass('error');
  });

  it('click Copy calls copyToClipboard and shows "Copied!", then reverts', () => {
    render(<TranscriptionCard text="hello" isError={false} time={time} />);
    fireEvent.click(screen.getByText('Copy'));

    expect(copyToClipboard).toHaveBeenCalledWith('hello');
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
