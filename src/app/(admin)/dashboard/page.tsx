'use client';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <div className="mb-8">
        <h1 className="font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">Dashboard</h1>
      </div>

      <div className="flex flex-col gap-4">
        <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
          <h2 className="mb-2 text-sm font-semibold text-[#F0F6FC]">Usage</h2>
          <p className="text-sm text-[#8B949E]">Usage stats coming soon.</p>
        </section>

        <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
          <h2 className="mb-2 text-sm font-semibold text-[#F0F6FC]">Settings</h2>
          <p className="text-sm text-[#8B949E]">Settings coming soon.</p>
        </section>
      </div>
    </div>
  );
}
