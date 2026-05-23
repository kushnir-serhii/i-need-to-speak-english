import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  visitorId: string | null;
  visitorCount: number;
  dailyCap: number;
  dailyRequests: number;
  dailyRequestLimit: number;
  enroll: (visitorId: string, count: number, cap: number) => void;
  updateStats: (
    count: number,
    cap: number,
    dailyRequests: number,
    dailyRequestLimit: number,
  ) => void;
  incrementRequests: () => void;
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
      reset: () => {
        set({
          visitorId: null,
          visitorCount: 0,
          dailyCap: 0,
          dailyRequests: 0,
          dailyRequestLimit: 0,
        });
        if (typeof window !== 'undefined') {
          document.cookie = 'intse-visitor=; max-age=0; path=/';
        }
      },
    }),
    {
      name: 'intse-user',
    },
  ),
);
