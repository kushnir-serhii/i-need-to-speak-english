'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (useUserStore.getState().role === 'admin') {
      router.push('/');
    }
  }, [router]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json() as { role: string };
        useUserStore.getState().setRoleFromApi(data.role);
        router.push('/');
      } else {
        setError('Invalid username or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0D1117]">
      <div className="w-full max-w-sm rounded-xl border border-[#30363D] bg-[#161B22] p-8">
        <h1 className="mb-6 text-xl font-bold text-[#F0F6FC]">Owner Login</h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[#F0F6FC]">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#F0F6FC]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white hover:bg-[#2F81F7]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
