'use client';

interface CharCounterProps {
  count: number;
}

export function CharCounter({ count }: CharCounterProps) {
  if (count === 0) return null;

  const isWarning = count >= 900;

  return (
    <span
      className="text-xs"
      style={{ color: isWarning ? '#D29922' : '#9397ab' }}
    >
      {count} / 1000
    </span>
  );
}
