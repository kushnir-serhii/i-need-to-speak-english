'use client';

import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconLogout } from '@/assets/icons';
import { ButtonOrLink } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconAdmin({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export const Navigation: React.FC = () => {
  const role = useUserStore((state) => state.role);
  const pathname = usePathname();
  const router = useRouter();

  const isOwner = role === 'admin';

  async function handleSignOut(): Promise<void> {
    if (role === 'admin') {
      await fetch('/api/owner/logout', { method: 'POST' });
      useUserStore.getState().setRole(null);
      router.push('/login');
    } else {
      useUserStore.getState().reset();
    }
  }

  return (
    <div className="relative flex h-full flex-row-reverse items-center justify-between md:fixed md:flex-col lg:h-full">
      <ul className="flex items-start justify-between gap-0.5 rounded-full bg-gray-100 p-0.5 md:sticky md:top-60 md:flex-col md:bg-black/5 lg:top-52 xl:top-46 dark:bg-black dark:md:bg-white/5">
        <li className="flex items-center justify-center">
          <ButtonOrLink href="/" isActive={pathname === '/'} aria-label="Home" variant="ghost">
            <IconHome className="size-5 dark:text-white" />
          </ButtonOrLink>
        </li>
        {role !== null && (
          <li className="flex items-center justify-center">
            <ButtonOrLink
              href="/dashboard"
              isActive={pathname === '/dashboard'}
              aria-label="Dashboard"
              variant="ghost"
            >
              <IconDashboard className="size-5 dark:text-white" />
            </ButtonOrLink>
          </li>
        )}
        {isOwner && (
          <li className="flex items-center justify-center">
            <ButtonOrLink
              href="/admin"
              isActive={pathname === '/admin'}
              aria-label="Admin Panel"
              variant="ghost"
            >
              <IconAdmin className="size-5 dark:text-white" />
            </ButtonOrLink>
          </li>
        )}
      </ul>
      <div className="rounded-full bg-gray-100 md:sticky md:bottom-4 dark:bg-black">
        <ButtonOrLink variant="ghost" className="bg-black/5 dark:md:bg-white/5" onClick={() => { void handleSignOut(); }}>
          <IconLogout className="size-5 dark:text-white" />
        </ButtonOrLink>
      </div>
      <div className="absolute inset-0 -z-10 bg-white blur-[15px] md:hidden"></div>
    </div>
  );
};
