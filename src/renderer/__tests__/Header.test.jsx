// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(cleanup);
import Header, { formatTime } from '../components/Header.jsx';

const baseConfig = { hotkey: 'Super+Shift+D', mode: 'local' };

describe('Header', () => {
  it('renders "Local Dictation" title', () => {
    render(<Header config={baseConfig} status="ready" secondsLeft={0} />);
    expect(screen.getByText('Local Dictation')).toBeInTheDocument();
  });

  it('shows correct status text for ready', () => {
    render(<Header config={baseConfig} status="ready" secondsLeft={0} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows correct status text for recording', () => {
    render(<Header config={baseConfig} status="recording" secondsLeft={60} />);
    expect(screen.getByText('Recording...')).toBeInTheDocument();
  });

  it('shows correct status text for transcribing', () => {
    render(<Header config={baseConfig} status="transcribing" secondsLeft={0} />);
    expect(screen.getByText('Transcribing...')).toBeInTheDocument();
  });

  it('status dot has matching CSS class', () => {
    const { container } = render(<Header config={baseConfig} status="recording" secondsLeft={60} />);
    const dot = container.querySelector('.status-dot');
    expect(dot).toHaveClass('recording');
  });

  it('timer visible when recording with secondsLeft > 0', () => {
    const { container } = render(<Header config={baseConfig} status="recording" secondsLeft={45} />);
    const timer = container.querySelector('.timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent('0:45');
  });

  it('timer hidden when status is ready', () => {
    const { container } = render(<Header config={baseConfig} status="ready" secondsLeft={0} />);
    expect(container.querySelector('.timer')).not.toBeInTheDocument();
  });

  it('displays config hotkey and mode badges', () => {
    render(<Header config={{ hotkey: 'Ctrl+D', mode: 'cloud' }} status="ready" secondsLeft={0} />);
    expect(screen.getByText('Ctrl+D')).toBeInTheDocument();
    expect(screen.getByText('cloud')).toBeInTheDocument();
  });
});

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [60, '1:00'],
    [125, '2:05'],
  ])('formatTime(%i) → %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});
