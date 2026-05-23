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
      style={{ color: isWarning ? '#D29922' : '#8B949E' }}
    >
      {count} / 1000
    </span>
  );
}
