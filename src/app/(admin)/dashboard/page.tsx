'use client';

import { UsageIndicator } from '@/components/dashboard/UsageIndicator';
import { LanguageSelectorCard } from '@/components/dashboard/LanguageSelectorCard';
import PromptCard from '@/components/dashboard/PromptCard';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <h1 className="mb-8 font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">Dashboard</h1>
      <div className="flex w-full flex-col gap-8 lg:flex-row">
        {/* Section 1: Usage */}
        <section className="w-full rounded-lg border border-[#30363D] bg-[#161B22] p-6">
          <UsageIndicator />
        </section>

        {/* Section 2: Language Selector */}
        <section className="w-full rounded-lg border border-[#30363D] bg-[#161B22] p-6">
          <LanguageSelectorCard />
        </section>
      </div>
      {/* Section 3: Prompt Card */}
      <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <PromptCard />
      </section>
    </div>
  );
}
