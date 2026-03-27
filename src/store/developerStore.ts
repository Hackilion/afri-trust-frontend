import { create } from 'zustand';

const STORAGE_KEY = 'afritrust-developer-preferences';

type DeveloperPreferences = {
  /** Show workflow JSON, simulation, and technical validation details. */
  workflowDevMode: boolean;
  /** Treat missing integration keys on custom/webhook as blocking in the UI (server still enforces on publish). */
  workflowStrictIntegration: boolean;
};

type DeveloperStore = DeveloperPreferences & {
  setWorkflowDevMode: (value: boolean) => void;
  setWorkflowStrictIntegration: (value: boolean) => void;
};

function readStored(): Partial<DeveloperPreferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<DeveloperPreferences>;
  } catch {
    return {};
  }
}

function persist(prefs: DeveloperPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / quota */
  }
}

const stored = readStored();

export const useDeveloperStore = create<DeveloperStore>((set, get) => ({
  workflowDevMode: stored.workflowDevMode ?? false,
  workflowStrictIntegration: stored.workflowStrictIntegration ?? true,
  setWorkflowDevMode: value => {
    set({ workflowDevMode: value });
    const s = get();
    persist({ workflowDevMode: s.workflowDevMode, workflowStrictIntegration: s.workflowStrictIntegration });
  },
  setWorkflowStrictIntegration: value => {
    set({ workflowStrictIntegration: value });
    const s = get();
    persist({ workflowDevMode: s.workflowDevMode, workflowStrictIntegration: s.workflowStrictIntegration });
  },
}));
