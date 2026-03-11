// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Toast from '../components/Toast.jsx';

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('has .visible class when message is truthy', () => {
    const { container } = render(<Toast message="Success" onDone={() => {}} />);
    expect(container.querySelector('.toast')).toHaveClass('visible');
  });

  it('does not have .visible class when message is null', () => {
    const { container } = render(<Toast message={null} onDone={() => {}} />);
    expect(container.querySelector('.toast')).not.toHaveClass('visible');
  });

  it('renders message text', () => {
    const { container } = render(<Toast message="Hello" onDone={() => {}} />);
    expect(container.querySelector('.toast')).toHaveTextContent('Hello');
  });

  it('calls onDone after 3 seconds', () => {
    const onDone = vi.fn();
    render(<Toast message="test" onDone={onDone} />);

    expect(onDone).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
