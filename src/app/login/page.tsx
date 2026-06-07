'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (useUserStore.getState().role === 'admin') {
      router.push('/');
    }
  }, [router]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === 'login' ? '/api/admin/login' : '/api/admin/register';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json() as { role?: string; error?: string };

      if (res.ok && data.role) {
        useUserStore.getState().setRoleFromApi(data.role);
        router.push('/');
      } else {
        if (data.error === 'username_taken') {
          setError('That username is already taken.');
        } else if (data.error === 'invalid_credentials') {
          setError('Invalid username or password.');
        } else if (data.error === 'username and password (min 8 chars) are required') {
          setError('Password must be at least 8 characters.');
        } else {
          setError('Something went wrong. Please try again.');
        }
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

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-[#30363D] p-0.5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-[#2F81F7] text-white'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-[#2F81F7] text-white'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            }`}
          >
            Register
          </button>
        </div>

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
              Password{mode === 'register' && <span className="ml-1 text-[#8B949E]">(min 8 chars)</span>}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : undefined}
                className="w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 pr-10 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white hover:bg-[#2F81F7]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
