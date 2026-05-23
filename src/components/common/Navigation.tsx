'use client';

import { IconHome, IconLogout } from '@/assets/icons';
import { ButtonOrLink } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';

export const Navigation: React.FC = () => {
  const reset = useUserStore((state) => state.reset);
  return (
    <div className="relative flex h-full flex-row-reverse items-center justify-between md:fixed md:flex-col lg:h-full">
      <ul className="flex items-start justify-between gap-0.5 rounded-full bg-gray-100 p-0.5 md:sticky md:top-60 md:flex-col md:bg-black/5 lg:top-52 xl:top-46 dark:bg-black dark:md:bg-white/5">
        <li className="flex items-center justify-center">
          <ButtonOrLink href="#" aria-label="Home" variant="ghost">
            <IconHome className="size-5 dark:text-white" />
          </ButtonOrLink>
        </li>
      </ul>
      <div className="rounded-full bg-gray-100 md:sticky md:bottom-4 dark:bg-black">
        <ButtonOrLink variant="ghost" className="bg-black/5 dark:md:bg-white/5" onClick={reset}>
          <IconLogout className="size-5 dark:text-white" />
        </ButtonOrLink>
      </div>
      <div className="absolute inset-0 -z-10 bg-white blur-[15px] md:hidden"></div>
    </div>
  );
};
