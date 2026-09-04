import { Logo } from '@/components/ui';
import { Navigation } from '@/components/common';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed bottom-0 z-50 w-screen flex-col border-t border-neutral-900 bg-bg p-3 md:relative md:w-18.5 md:flex md:border-t-0 md:bg-transparent xl:min-h-full">
      <div className="hidden md:block">
        <Logo />
      </div>
      <Navigation />
    </aside>
  );
};
