interface IntseMarkProps {
  /** Rendered pixel size of the square mark. */
  size?: number;
  /** Face expression. `idle` is the resting smile. */
  state?: 'idle' | 'listening' | 'thinking' | 'pleased';
  className?: string;
  title?: string;
}

/**
 * The INTSE mark: a speech bubble with a face. One shape does both jobs —
 * brand lockup and assistant avatar — and stays legible down to ~20px.
 * See design doc 1e.
 */
export function IntseMark({ size = 28, state = 'idle', className, title }: IntseMarkProps) {
  const stroke = size <= 22 ? 3 : 2.5;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block' }}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="4"
        y="6"
        width="40"
        height="30"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        d="M16 36 L16 44 L26 36"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      {state === 'thinking' ? (
        <>
          <circle cx="15" cy="21" r="2.4" fill="currentColor" />
          <circle cx="24" cy="21" r="2.4" fill="currentColor" />
          <circle cx="33" cy="21" r="2.4" fill="currentColor" />
        </>
      ) : state === 'listening' ? (
        <>
          <path d="M14 19 q4 -4 8 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M26 19 q4 -4 8 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="24" cy="27" r="3" fill="currentColor" />
        </>
      ) : state === 'pleased' ? (
        <>
          <path d="M14 18 q4 4 8 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M26 18 q4 4 8 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M17 26 q7 6 14 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="18" cy="20" r="2.6" fill="currentColor" />
          <circle cx="30" cy="20" r="2.6" fill="currentColor" />
          {size > 22 ? (
            <path d="M18 27 q6 4 12 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          ) : null}
        </>
      )}
    </svg>
  );
}
