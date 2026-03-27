import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApplicantFilters } from '../types';

const DEFAULT_FILTERS: ApplicantFilters = {
  page: 1,
  pageSize: 10,
  sortBy: 'submittedAt',
  sortDirection: 'desc',
};

interface FilterStore {
  filters: ApplicantFilters;
  setFilter: <K extends keyof ApplicantFilters>(key: K, value: ApplicantFilters[K]) => void;
  setFilters: (partial: Partial<ApplicantFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value, page: key === 'page' ? (value as number) : 1 } })),
      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial, page: 1 } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setPage: (page) => set((s) => ({ filters: { ...s.filters, page } })),
    }),
    { name: 'afritrust-filters', storage: { getItem: (k) => { try { return JSON.parse(sessionStorage.getItem(k) ?? 'null'); } catch { return null; } }, setItem: (k, v) => sessionStorage.setItem(k, JSON.stringify(v)), removeItem: (k) => sessionStorage.removeItem(k) } }
  )
);
