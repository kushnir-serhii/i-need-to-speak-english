'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useNotification } from '@/hooks/useNotification';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatsData {
  totalVisitors: number;
  todayVisitors: number;
  todayMessages: number;
  todayTokens: number;
  chartData: { label: string; messages: number; tokens: number }[];
}

interface Visitor {
  visitorId: string;
  enrolledAt: string;
  dailyRequests: number;
  dailyTokens: number;
  lastResetAt: string;
}

interface VisitorsResponse {
  visitors: Visitor[];
  total: number;
  page: number;
  limit: number;
}

interface ResetResponse {
  ok: true;
  visitorId: string;
  dailyRequests: 0;
  dailyTokens: 0;
  lastResetAt: string;
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8B949E]">{label}</p>
      <p className="text-3xl font-bold text-[#F0F6FC]">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminPanelPage() {
  const router = useRouter();
  const role = useUserStore((s) => s.role);
  const { toast } = useNotification();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [resetting, setResetting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (role !== null && role !== 'admin') {
      router.replace('/');
      return;
    }

    fetch('/api/owner/stats')
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.replace('/login');
          return null;
        }
        return r.json() as Promise<StatsData>;
      })
      .then((data) => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role, router]);

  useEffect(() => {
    if (role !== null && role !== 'admin') return;

    fetch('/api/owner/visitors?page=1&limit=50')
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.replace('/login');
          return null;
        }
        return r.json() as Promise<VisitorsResponse>;
      })
      .then((data) => { if (data) setVisitors(data.visitors); })
      .catch(() => {})
      .finally(() => setVisitorsLoading(false));
  }, [role, router]);

  const handleReset = useCallback(async (visitorId: string): Promise<void> => {
    setResetting((prev) => new Set(prev).add(visitorId));
    try {
      const r = await fetch(`/api/owner/visitors/${visitorId}/reset`, { method: 'POST' });
      if (!r.ok) {
        toast('error', 'Reset failed.');
        return;
      }
      const data = await r.json() as ResetResponse;
      setVisitors((prev) =>
        prev.map((v) =>
          v.visitorId === visitorId
            ? { ...v, dailyRequests: data.dailyRequests, dailyTokens: data.dailyTokens, lastResetAt: data.lastResetAt }
            : v,
        ),
      );
      toast('info', 'Visitor reset.');
    } catch {
      toast('error', 'Reset failed.');
    } finally {
      setResetting((prev) => {
        const next = new Set(prev);
        next.delete(visitorId);
        return next;
      });
    }
  }, [toast]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">Admin Panel</h1>
      </div>

      {loading && <p className="text-sm text-[#8B949E]">Loading stats…</p>}

      {!loading && stats && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Visitors" value={stats.totalVisitors} />
            <KpiCard label="Active Today" value={stats.todayVisitors} />
            <KpiCard label="Messages Today" value={stats.todayMessages} />
            <KpiCard label="Tokens Today" value={stats.todayTokens} />
          </div>

          {stats.chartData.length > 0 ? (
            <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
              <h2 className="mb-4 text-sm font-semibold text-[#F0F6FC]">
                Top Visitors by Messages Today
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="label" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={{ stroke: '#30363D' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8 }}
                    labelStyle={{ color: '#F0F6FC', fontSize: 12 }}
                    itemStyle={{ color: '#8B949E', fontSize: 12 }}
                  />
                  <Bar dataKey="messages" fill="#2F81F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          ) : (
            <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
              <p className="text-sm text-[#8B949E]">No visitor activity today yet.</p>
            </section>
          )}
        </>
      )}

      {/* Visitors Table */}
      <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[#F0F6FC]">Visitors</h2>

        {visitorsLoading && (
          <p className="text-sm text-[#8B949E]">Loading visitors…</p>
        )}

        {!visitorsLoading && visitors.length === 0 && (
          <p className="text-sm text-[#8B949E]">No visitors yet.</p>
        )}

        {!visitorsLoading && visitors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#30363D]">
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Visitor ID</th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Enrolled</th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Requests Today</th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Tokens Today</th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Last Reset</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide text-[#8B949E]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.visitorId} className="border-b border-[#30363D] last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-[#F0F6FC]">
                      …{visitor.visitorId.slice(-8)}
                    </td>
                    <td className="py-3 pr-4 text-[#8B949E]">
                      {new Date(visitor.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-[#F0F6FC]">
                      {visitor.dailyRequests.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-[#F0F6FC]">
                      {visitor.dailyTokens.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-[#8B949E]">
                      {new Date(visitor.lastResetAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={resetting.has(visitor.visitorId)}
                        onClick={() => { void handleReset(visitor.visitorId); }}
                        className="rounded-md border border-[#30363D] px-3 py-1 text-xs font-medium text-[#8B949E] transition-colors hover:border-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#161B22] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {resetting.has(visitor.visitorId) ? 'Resetting…' : 'Reset'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
