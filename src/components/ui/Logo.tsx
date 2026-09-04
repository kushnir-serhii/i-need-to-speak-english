import Link from 'next/link';
import { IntseMark } from './IntseMark';

interface LogoProps {
  /** Show the "INTSE" wordmark beside the bubble. */
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ showWordmark = false }) => {
  return (
    <Link href="/" aria-label="INTSE home" className="inline-flex items-center gap-2.5">
      <span className="text-accent">
        <IntseMark size={28} />
      </span>
      {showWordmark && (
        <span className="font-heading text-[17px] font-medium tracking-[0.02em] text-ink">
          INTSE
        </span>
      )}
    </Link>
  );
};
