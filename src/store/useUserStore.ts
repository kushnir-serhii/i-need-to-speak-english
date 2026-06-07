import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'user' | 'admin' | null;

interface UserState {
  visitorId: string | null;
  visitorCount: number;
  dailyCap: number;
  dailyRequests: number;
  dailyRequestLimit: number;
  role: UserRole;
  enroll: (visitorId: string, count: number, cap: number) => void;
  updateStats: (
    count: number,
    cap: number,
    dailyRequests: number,
    dailyRequestLimit: number,
  ) => void;
  incrementRequests: () => void;
  setRole: (role: UserRole) => void;
  setRoleFromApi: (rawRole: string) => void;
  setVisitorId: (id: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      visitorId: null,
      visitorCount: 0,
      dailyCap: 0,
      dailyRequests: 0,
      dailyRequestLimit: 0,
      role: null,
      enroll: (visitorId: string, count: number, cap: number) => {
        set({ visitorId, visitorCount: count, dailyCap: cap });
        if (typeof window !== 'undefined') {
          document.cookie = `intse-visitor=${visitorId}; max-age=31536000; path=/`;
        }
      },
      updateStats: (
        count: number,
        cap: number,
        dailyRequests: number,
        dailyRequestLimit: number,
      ) => {
        set({ visitorCount: count, dailyCap: cap, dailyRequests, dailyRequestLimit });
      },
      incrementRequests: () => {
        set((state) => ({ dailyRequests: state.dailyRequests + 1 }));
      },
      setRole: (role: UserRole) => set({ role }),
      setRoleFromApi: (rawRole: string) => {
        const mapped: UserRole = rawRole === 'owner' || rawRole === 'admin' ? 'admin' : 'user';
        set({ role: mapped });
      },
      setVisitorId: (id: string) => set({ visitorId: id }),
      reset: () => {
        set({
          visitorId: null,
          visitorCount: 0,
          dailyCap: 0,
          dailyRequests: 0,
          dailyRequestLimit: 0,
          role: null,
        });
        if (typeof window !== 'undefined') {
          document.cookie = 'intse-visitor=; max-age=0; path=/';
        }
      },
    }),
    {
      name: 'intse-user',
      partialize: (state) => ({
        visitorId: state.visitorId,
        visitorCount: state.visitorCount,
        dailyCap: state.dailyCap,
        dailyRequests: state.dailyRequests,
        dailyRequestLimit: state.dailyRequestLimit,
        // role is intentionally excluded — re-derived on every page load
      }),
    },
  ),
);
