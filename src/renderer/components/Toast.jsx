import { useEffect } from 'react';

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className={`toast${message ? ' visible' : ''}`}>
      {message}
    </div>
  );
}
