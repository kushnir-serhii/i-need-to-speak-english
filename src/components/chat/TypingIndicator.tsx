'use client';

import styles from './TypingIndicator.module.css';

export function TypingIndicator() {
  return (
    <div className="max-w-[75%] mr-auto bg-[#161B22] text-white rounded-2xl rounded-bl-sm px-4 py-2.5 border border-[#30363D] flex items-center gap-1">
      <span className={styles.dot} />
      <span className={`${styles.dot} ${styles.dot2}`} />
      <span className={`${styles.dot} ${styles.dot3}`} />
    </div>
  );
}
