import Link from 'next/link';

export const Logo: React.FC = () => {
  return (
    <Link href="/">
      <div className="rounded-full bg-gray-900 p-[13px] dark:bg-white">
        <span className="flex size-6 items-center justify-center text-xs font-bold text-white dark:text-black">
          INTSE
        </span>
      </div>
    </Link>
  );
};
