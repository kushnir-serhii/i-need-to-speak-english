import Link from 'next/link';
import { IntseMark } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <span className="text-accent-400">
        <IntseMark size={52} state="thinking" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-medium text-ink">Page not found</h1>
        <p className="max-w-[320px] text-sm leading-relaxed text-neutral-400">
          We can&rsquo;t find the page you&rsquo;re looking for. It may have moved, or never
          existed.
        </p>
      </div>
      <Link
        href="/"
        className="grid h-10 place-items-center rounded-[10px] border border-accent px-5 text-sm text-accent-200 transition-colors hover:bg-accent/[0.14]"
      >
        Back to chat
      </Link>
    </div>
  );
}
