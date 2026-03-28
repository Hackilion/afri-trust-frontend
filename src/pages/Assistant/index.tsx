import type { ChatCompletionMessageParam, MLCEngine } from '@mlc-ai/web-llm';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Copy,
  GitBranch,
  History,
  Loader2,
  Plus,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AssistantOrbLogo } from '../../components/ui/afritrust-mark';

import {
  afritrustAssistantTools,
  AFRI_ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_MODEL_DEFAULT,
  executeAssistantTool,
} from '../../features/assistant/afritrustAssistantTools';
import { AssistantMessageBlock } from '../../features/assistant/AssistantMessageBlock';
import {
  assistantLlmChatCompletion,
  assistantLlmChatCompletionPlain,
  assistantLlmErrorShouldFallback,
  fetchAssistantLlmStatus,
  type ChatCompletionLike,
} from '../../features/assistant/assistantLlmClient';
import { ApiError } from '../../lib/apiClient';
import { isLiveApi } from '../../lib/apiConfig';
import { cn } from '../../lib/utils';
import {
  createAssistantSession,
  deleteAssistantSession,
  getAssistantSession,
  listAssistantSessions,
  patchAssistantSession,
  type AssistantSessionListItem,
} from '../../services/assistantSessionsService';
import { useUIStore } from '../../store/uiStore';

/** WebLLM Hermes-2-Pro: no `role: system` — embed copilot instructions in the first user turn. */
function webllmFirstUserContent(userText: string): string {
  return `${AFRI_ASSISTANT_SYSTEM_PROMPT}\n\n---\nUser request:\n${userText}`;
}

const MAX_AGENT_TURNS = 10;

type UiMessage = { role: 'user' | 'assistant'; content: string; id: string };
type ToolLogLine = { name: string; ok: boolean; preview: string };

const ASSISTANT_DRAFT_KEY = 'afritrust-assistant-draft-v1';
const ASSISTANT_SESSIONS_KEY = 'afritrust-assistant-sessions-v1';
const MAX_ARCHIVED_SESSIONS = 12;

type PersistedAssistantSnapshot = {
  v: 1 | 2;
  updatedAt: number;
  messages: UiMessage[];
  apiMessages: ChatCompletionMessageParam[];
  toolLog: ToolLogLine[];
  suggestionChecks?: Record<string, boolean>;
};

type ArchivedAssistantSession = {
  id: string;
  updatedAt: number;
  preview: string;
  data: PersistedAssistantSnapshot;
};

function readArchivedSessions(): ArchivedAssistantSession[] {
  try {
    const raw = localStorage.getItem(ASSISTANT_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ArchivedAssistantSession =>
        x &&
        typeof x === 'object' &&
        'id' in x &&
        'data' in x &&
        typeof (x as ArchivedAssistantSession).preview === 'string'
    );
  } catch {
    return [];
  }
}

function writeArchivedSessions(sessions: ArchivedAssistantSession[]) {
  try {
    localStorage.setItem(ASSISTANT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_ARCHIVED_SESSIONS)));
  } catch {
    /* quota */
  }
}

function readDraftFromStorage(): PersistedAssistantSnapshot | null {
  try {
    const raw = localStorage.getItem(ASSISTANT_DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedAssistantSnapshot;
    if ((p.v !== 1 && p.v !== 2) || !Array.isArray(p.messages)) return null;
    return {
      v: p.v === 2 ? 2 : 1,
      updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
      messages: p.messages,
      apiMessages: Array.isArray(p.apiMessages) ? p.apiMessages : [],
      toolLog: Array.isArray(p.toolLog) ? p.toolLog : [],
      suggestionChecks:
        typeof p.suggestionChecks === 'object' && p.suggestionChecks !== null
          ? (p.suggestionChecks as Record<string, boolean>)
          : {},
    };
  } catch {
    return null;
  }
}

function initialContextInjected(apiMsgs: ChatCompletionMessageParam[]): boolean {
  const firstUser = apiMsgs.find(m => m.role === 'user');
  return !!(
    firstUser &&
    typeof firstUser.content === 'string' &&
    firstUser.content.includes('\n---\nUser request:\n')
  );
}

function parseServerSessionState(raw: Record<string, unknown>): {
  messages: UiMessage[];
  apiMessages: ChatCompletionMessageParam[];
  toolLog: ToolLogLine[];
  suggestionChecks: Record<string, boolean>;
} {
  const messages = Array.isArray(raw.messages) ? (raw.messages as UiMessage[]) : [];
  const apiMessages = Array.isArray(raw.apiMessages)
    ? (raw.apiMessages as ChatCompletionMessageParam[])
    : [];
  const toolLog = Array.isArray(raw.toolLog) ? (raw.toolLog as ToolLogLine[]) : [];
  const suggestionChecks =
    typeof raw.suggestionChecks === 'object' && raw.suggestionChecks !== null
      ? (raw.suggestionChecks as Record<string, boolean>)
      : {};
  return { messages, apiMessages, toolLog, suggestionChecks };
}

function formatRelativeTime(ts: number): string {
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type AssistantCategoryKey = 'workflows' | 'verifications' | 'golive';

const ASSISTANT_CATEGORIES: Record<
  AssistantCategoryKey,
  { label: string; Icon: LucideIcon; prompts: string[] }
> = {
  workflows: {
    label: 'Workflows',
    Icon: GitBranch,
    prompts: ['List my published workflows', 'What tier profiles do we have?'],
  },
  verifications: {
    label: 'Verifications',
    Icon: ShieldCheck,
    prompts: ['Show recent verification sessions'],
  },
  golive: {
    label: 'Go live',
    Icon: Rocket,
    prompts: ['Summarize what I should do before going live with KYC'],
  },
};

const CATEGORY_SUGGESTION_TITLE: Record<AssistantCategoryKey, string> = {
  workflows: 'Workflow & tier ideas',
  verifications: 'Verification ideas',
  golive: 'Go-live ideas',
};

function AssistantCategoryTile({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 shadow-sm transition-shadow',
        active
          ? 'border-blue-300/80 bg-gradient-to-br from-blue-50 to-sky-50/80 shadow-md ring-2 ring-blue-100'
          : 'border-gray-200/90 bg-white hover:border-blue-200/60 hover:shadow-md'
      )}
    >
      <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-500')} />
      <span className={cn('text-sm font-medium', active ? 'text-blue-700' : 'text-gray-700')}>{label}</span>
    </motion.button>
  );
}

type SetupPhase = 'idle' | 'preparing' | 'ready';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function previewJson(s: string, max = 280) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function envAutoDownloadModel(): boolean {
  const v = import.meta.env.VITE_ASSISTANT_MODEL_AUTODOWNLOAD;
  return v === 'true' || v === '1';
}

function isParseOrToolError(msg: string): boolean {
  return (
    msg.includes('parsing outputMessage') ||
    msg.includes('ToolCallOutputParseError') ||
    msg.includes('function calling')
  );
}

/** Heading + description for the setup card while the model loads, keyed by overall progress. */
function setupPrepareCopy(frac: number | null): { title: string; blurb: string } {
  const p = Math.round((frac ?? 0) * 100);
  if (p < 20) {
    return {
      title: 'Starting setup',
      blurb:
        'Initializing the on-device engine. The first visit fills your browser cache; later opens skip most of this work.',
    };
  }
  if (p < 55) {
    return {
      title: 'Downloading & caching',
      blurb:
        'Pulling model parameters and shards. Progress is saved locally — you can leave this tab open while it runs.',
    };
  }
  if (p < 92) {
    return {
      title: 'Wiring things up',
      blurb:
        'Most of the payload is cached. Compiling and finishing remaining pieces so the assistant can run in your browser.',
    };
  }
  return {
    title: 'Almost ready',
    blurb: 'Finalizing — you’ll get a toast as soon as you can start chatting.',
  };
}

type CloudLlmStatus = 'loading' | 'disabled' | 'enabled';

export default function AssistantPage() {
  const addToast = useUIStore(s => s.addToast);
  const live = isLiveApi();

  const draftBoot = useMemo(() => readDraftFromStorage(), []);

  const [modelId] = useState(ASSISTANT_MODEL_DEFAULT);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const engineRef = useRef<MLCEngine | null>(null);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const [cloudLlmStatus, setCloudLlmStatus] = useState<CloudLlmStatus>('loading');
  const [usingCloudAssistant, setUsingCloudAssistant] = useState(true);

  const useCloudRef = useRef(false);
  useEffect(() => {
    useCloudRef.current = cloudLlmStatus === 'enabled' && usingCloudAssistant;
  }, [cloudLlmStatus, usingCloudAssistant]);

  const [loadProgress, setLoadProgress] = useState('');
  /** 0–1 from WebLLM `initProgressCallback`; drives the setup progress bar. */
  const [loadProgressFrac, setLoadProgressFrac] = useState<number | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'unknown' | 'hit' | 'miss'>('unknown');
  const [setupPhase, setSetupPhase] = useState<SetupPhase>('idle');
  const loadInFlight = useRef(false);
  const notifiedCloudLlmReady = useRef(false);
  const notifiedLocalReady = useRef(false);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    live ? [] : draftBoot?.messages ?? []
  );
  const [toolLog, setToolLog] = useState<ToolLogLine[]>(() =>
    live ? [] : draftBoot?.toolLog ?? []
  );
  const [showTools, setShowTools] = useState(true);
  const [activeCategory, setActiveCategory] = useState<AssistantCategoryKey | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState<ArchivedAssistantSession[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [suggestionChecks, setSuggestionChecks] = useState<Record<string, boolean>>(() =>
    live ? {} : draftBoot?.suggestionChecks ?? {}
  );
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteSessionsReady, setRemoteSessionsReady] = useState(() => !live);
  const [historyRemoteItems, setHistoryRemoteItems] = useState<AssistantSessionListItem[]>([]);
  const [remoteSessionCount, setRemoteSessionCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRootRef = useRef<HTMLDivElement>(null);

  const apiMessagesRef = useRef<ChatCompletionMessageParam[]>(
    live ? [] : draftBoot?.apiMessages ?? []
  );
  const contextInjectedRef = useRef(
    live ? false : initialContextInjected(draftBoot?.apiMessages ?? [])
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshArchivedMeta = useCallback(() => {
    setArchivedCount(readArchivedSessions().length);
  }, []);

  useEffect(() => {
    refreshArchivedMeta();
  }, [refreshArchivedMeta]);

  const readyToChat =
    live &&
    remoteSessionsReady &&
    cloudLlmStatus !== 'loading' &&
    ((cloudLlmStatus === 'enabled' && usingCloudAssistant) || !!engine);

  /** New chat / session ops: do not block on WebLLM or cloud model (only session bootstrap). */
  const sessionActionsReady = !live || remoteSessionsReady;

  const prepareCopy = loadingModel ? setupPrepareCopy(loadProgressFrac) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!live) return;
    const t = window.setTimeout(() => {
      if (messages.length === 0 && toolLog.length === 0) {
        try {
          localStorage.removeItem(ASSISTANT_DRAFT_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        const snapshot: PersistedAssistantSnapshot = {
          v: 2,
          updatedAt: Date.now(),
          messages,
          apiMessages: apiMessagesRef.current,
          toolLog,
          suggestionChecks,
        };
        localStorage.setItem(ASSISTANT_DRAFT_KEY, JSON.stringify(snapshot));
      } catch {
        /* quota */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [messages, toolLog, suggestionChecks, live, busy]);

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHistoryOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const root = historyRootRef.current;
      if (root && !root.contains(e.target as Node)) setHistoryOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, [historyOpen]);

  /** Loads WebLLM; returns engine or throws. Safe to call when already loaded (returns existing). */
  const ensureLocalEngine = useCallback(async (): Promise<MLCEngine> => {
    if (!live) throw new Error('Connect the live API to use the assistant.');
    if (engineRef.current) return engineRef.current;
    if (loadInFlight.current) {
      for (let i = 0; i < 80 && loadInFlight.current; i++) {
        await new Promise<void>(r => setTimeout(r, 100));
      }
      if (engineRef.current) return engineRef.current;
    }
    loadInFlight.current = true;
    setLoadingModel(true);
    setSetupPhase('preparing');
    setLoadProgress('Initializing…');
    setLoadProgressFrac(0);
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const eng = await CreateMLCEngine(modelId, {
        initProgressCallback: report => {
          setLoadProgress(report.text);
          setLoadProgressFrac(report.progress);
        },
      });
      engineRef.current = eng;
      setEngine(eng);
      setLoadProgress('');
      setLoadProgressFrac(null);
      setSetupPhase('ready');
      if (!notifiedLocalReady.current) {
        notifiedLocalReady.current = true;
        addToast('On-device model ready — start chatting.', 'success');
      }
      return eng;
    } catch (e) {
      setSetupPhase('idle');
      setLoadProgressFrac(null);
      setLoadProgress(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      loadInFlight.current = false;
      setLoadingModel(false);
    }
  }, [live, modelId, addToast]);

  const loadEngine = useCallback(async () => {
    try {
      await ensureLocalEngine();
    } catch {
      /* error surfaced in loadProgress */
    }
  }, [ensureLocalEngine]);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchAssistantLlmStatus();
        if (cancelled) return;
        if (s.enabled) {
          setCloudLlmStatus('enabled');
          setUsingCloudAssistant(true);
          setSetupPhase('ready');
          if (!notifiedCloudLlmReady.current) {
            notifiedCloudLlmReady.current = true;
            addToast('Assistant ready — using cloud assistant.', 'success');
          }
        } else {
          setCloudLlmStatus('disabled');
          setUsingCloudAssistant(false);
        }
      } catch {
        if (!cancelled) {
          setCloudLlmStatus('disabled');
          setUsingCloudAssistant(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live, addToast]);

  useEffect(() => {
    if (!live) {
      setRemoteSessionsReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listAssistantSessions(40);
        if (cancelled) return;
        setRemoteSessionCount(list.length);
        if (list.length === 0) {
          const created = await createAssistantSession();
          if (cancelled) return;
          const parsed = parseServerSessionState(created.state as Record<string, unknown>);
          setMessages(parsed.messages);
          setToolLog(parsed.toolLog);
          setSuggestionChecks(parsed.suggestionChecks);
          apiMessagesRef.current = parsed.apiMessages;
          contextInjectedRef.current = initialContextInjected(parsed.apiMessages);
          setRemoteSessionId(created.id);
          setRemoteSessionCount(1);
        } else {
          const top = list[0];
          const full = await getAssistantSession(top.id);
          if (cancelled) return;
          const parsed = parseServerSessionState(full.state as Record<string, unknown>);
          setMessages(parsed.messages);
          setToolLog(parsed.toolLog);
          setSuggestionChecks(parsed.suggestionChecks);
          apiMessagesRef.current = parsed.apiMessages;
          contextInjectedRef.current = initialContextInjected(parsed.apiMessages);
          setRemoteSessionId(full.id);
        }
      } catch {
        if (!cancelled) {
          try {
            const created = await createAssistantSession();
            if (!cancelled) {
              setRemoteSessionId(created.id);
              setRemoteSessionCount(1);
            }
          } catch {
            setRemoteSessionId(null);
          }
        }
      } finally {
        if (!cancelled) setRemoteSessionsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live]);

  useEffect(() => {
    if (!live || !remoteSessionId || !remoteSessionsReady) return;
    if (messages.length === 0 && toolLog.length === 0) return;
    const t = window.setTimeout(() => {
      const firstUser = messages.find(m => m.role === 'user');
      const preview = (firstUser?.content ?? 'New chat').replace(/\s+/g, ' ').trim().slice(0, 120);
      void patchAssistantSession(remoteSessionId, {
        preview: preview || 'New chat',
        state: {
          v: 2,
          messages,
          apiMessages: apiMessagesRef.current,
          toolLog,
          suggestionChecks,
        },
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [messages, toolLog, suggestionChecks, live, remoteSessionId, remoteSessionsReady]);

  useEffect(() => {
    if (!live || cloudLlmStatus === 'loading') return;
    if (cloudLlmStatus === 'enabled' && usingCloudAssistant) return;
    let cancelled = false;
    (async () => {
      try {
        const { hasModelInCache } = await import('@mlc-ai/web-llm');
        const cached = await hasModelInCache(modelId);
        if (cancelled) return;
        setCacheStatus(cached ? 'hit' : 'miss');
        if (cached || envAutoDownloadModel()) {
          void loadEngine();
        } else {
          setSetupPhase('idle');
        }
      } catch {
        if (!cancelled) setCacheStatus('miss');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live, cloudLlmStatus, usingCloudAssistant, modelId, loadEngine]);

  useEffect(() => {
    if (engine && setupPhase !== 'ready') setSetupPhase('ready');
  }, [engine, setupPhase]);

  const archiveCurrentIntoHistory = useCallback(() => {
    if (messages.length === 0) return;
    const snapshot: PersistedAssistantSnapshot = {
      v: 2,
      updatedAt: Date.now(),
      messages,
      apiMessages: apiMessagesRef.current,
      toolLog,
      suggestionChecks,
    };
    const firstUser = messages.find(m => m.role === 'user');
    const preview = (firstUser?.content ?? 'Conversation').replace(/\s+/g, ' ').trim().slice(0, 56);
    const archived: ArchivedAssistantSession = {
      id: uid(),
      updatedAt: Date.now(),
      preview: preview || 'Conversation',
      data: snapshot,
    };
    writeArchivedSessions([archived, ...readArchivedSessions()].slice(0, MAX_ARCHIVED_SESSIONS));
    refreshArchivedMeta();
  }, [messages, toolLog, suggestionChecks, refreshArchivedMeta]);

  const resetConversation = useCallback(() => {
    const hadMessages = messages.length > 0;
    if (!live && messages.length > 0) {
      archiveCurrentIntoHistory();
    }
    if (live && remoteSessionId && remoteSessionsReady) {
      void patchAssistantSession(remoteSessionId, {
        preview: 'New chat',
        state: {
          v: 2,
          messages: [],
          apiMessages: [],
          toolLog: [],
          suggestionChecks: {},
        },
      }).catch(() => {});
    }
    setMessages([]);
    setToolLog([]);
    setSuggestionChecks({});
    apiMessagesRef.current = [];
    contextInjectedRef.current = false;
    setUsingCloudAssistant(cloudLlmStatus === 'enabled');
    try {
      localStorage.removeItem(ASSISTANT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    addToast(
      hadMessages
        ? live
          ? 'Chat cleared for this session'
          : 'Conversation cleared — find it under History'
        : 'Conversation cleared',
      'success'
    );
  }, [
    addToast,
    archiveCurrentIntoHistory,
    cloudLlmStatus,
    live,
    messages.length,
    remoteSessionId,
    remoteSessionsReady,
  ]);

  const openHistoryPanel = useCallback(async () => {
    if (live) {
      try {
        const list = await listAssistantSessions(40);
        setHistoryRemoteItems(list);
        setRemoteSessionCount(list.length);
      } catch {
        setHistoryRemoteItems([]);
      }
    } else {
      setArchivedSessions(readArchivedSessions());
    }
    setHistoryOpen(true);
  }, [live]);

  const selectRemoteSession = useCallback(
    async (id: string) => {
      if (id === remoteSessionId) {
        setHistoryOpen(false);
        return;
      }
      if (live && remoteSessionId && remoteSessionsReady) {
        try {
          const firstUser = messages.find(m => m.role === 'user');
          const preview = (firstUser?.content ?? 'New chat').replace(/\s+/g, ' ').trim().slice(0, 120);
          await patchAssistantSession(remoteSessionId, {
            preview: preview || 'New chat',
            state: {
              v: 2,
              messages,
              apiMessages: apiMessagesRef.current,
              toolLog,
              suggestionChecks,
            },
          });
        } catch {
          /* continue */
        }
      }
      try {
        const full = await getAssistantSession(id);
        const p = parseServerSessionState(full.state as Record<string, unknown>);
        setMessages(p.messages);
        setToolLog(p.toolLog);
        setSuggestionChecks(p.suggestionChecks);
        apiMessagesRef.current = p.apiMessages;
        contextInjectedRef.current = initialContextInjected(p.apiMessages);
        setRemoteSessionId(full.id);
        setHistoryOpen(false);
        addToast('Opened chat', 'success');
      } catch {
        addToast('Could not open chat', 'error');
      }
    },
    [live, remoteSessionId, remoteSessionsReady, messages, toolLog, suggestionChecks, addToast]
  );

  const startNewRemoteSession = useCallback(async () => {
    if (!live) {
      resetConversation();
      return;
    }
    if (!remoteSessionsReady) {
      addToast('Still syncing your sessions — try again in a moment.', 'info');
      return;
    }
    const hasConversationContent = messages.length > 0 || toolLog.length > 0;
    if (!hasConversationContent) {
      addToast(
        'This chat is already empty. Open History to switch or delete a session, or type a message here.',
        'info'
      );
      return;
    }
    try {
      if (remoteSessionId) {
        const firstUser = messages.find(m => m.role === 'user');
        const preview = (firstUser?.content ?? 'New chat').replace(/\s+/g, ' ').trim().slice(0, 120);
        await patchAssistantSession(remoteSessionId, {
          preview: preview || 'New chat',
          state: {
            v: 2,
            messages,
            apiMessages: apiMessagesRef.current,
            toolLog,
            suggestionChecks,
          },
        });
      }
      const created = await createAssistantSession();
      setRemoteSessionId(created.id);
      setRemoteSessionCount(c => c + 1);
      setMessages([]);
      setToolLog([]);
      setSuggestionChecks({});
      apiMessagesRef.current = [];
      contextInjectedRef.current = false;
      try {
        localStorage.removeItem(ASSISTANT_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setUsingCloudAssistant(cloudLlmStatus === 'enabled');
      addToast('New chat started', 'success');
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      addToast('Could not start a new chat', 'error');
    }
  }, [
    live,
    remoteSessionId,
    remoteSessionsReady,
    messages,
    toolLog,
    suggestionChecks,
    cloudLlmStatus,
    addToast,
    resetConversation,
  ]);

  const deleteRemoteSessionById = useCallback(
    async (sessionId: string) => {
      if (!live) return;
      try {
        await deleteAssistantSession(sessionId);
        if (sessionId === remoteSessionId) {
          const list = await listAssistantSessions(40);
          setHistoryRemoteItems(list);
          setRemoteSessionCount(list.length);
          if (list.length > 0) {
            const full = await getAssistantSession(list[0].id);
            const p = parseServerSessionState(full.state as Record<string, unknown>);
            setMessages(p.messages);
            setToolLog(p.toolLog);
            setSuggestionChecks(p.suggestionChecks);
            apiMessagesRef.current = p.apiMessages;
            contextInjectedRef.current = initialContextInjected(p.apiMessages);
            setRemoteSessionId(full.id);
          } else {
            const created = await createAssistantSession();
            const p = parseServerSessionState(created.state as Record<string, unknown>);
            setMessages(p.messages);
            setToolLog(p.toolLog);
            setSuggestionChecks(p.suggestionChecks);
            apiMessagesRef.current = p.apiMessages;
            contextInjectedRef.current = initialContextInjected(p.apiMessages);
            setRemoteSessionId(created.id);
            setRemoteSessionCount(1);
          }
        } else {
          setHistoryRemoteItems(prev => prev.filter(s => s.id !== sessionId));
          setRemoteSessionCount(c => Math.max(0, c - 1));
        }
        addToast('Chat deleted', 'success');
      } catch {
        addToast('Could not delete chat', 'error');
      }
    },
    [live, remoteSessionId, addToast]
  );

  const applyArchivedSession = useCallback(
    (session: ArchivedAssistantSession) => {
      archiveCurrentIntoHistory();
      const d = session.data;
      setMessages(d.messages);
      setToolLog(d.toolLog ?? []);
      setSuggestionChecks(d.suggestionChecks ?? {});
      apiMessagesRef.current = d.apiMessages ?? [];
      contextInjectedRef.current = initialContextInjected(apiMessagesRef.current);
      setArchivedSessions(readArchivedSessions());
      refreshArchivedMeta();
      setHistoryOpen(false);
      addToast('Opened a past conversation', 'success');
    },
    [addToast, archiveCurrentIntoHistory, refreshArchivedMeta]
  );

  const onToggleSuggestion = useCallback((stableId: string, checked: boolean) => {
    setSuggestionChecks(prev => {
      if (prev[stableId] === checked) return prev;
      return { ...prev, [stableId]: checked };
    });
  }, []);

  const copyAssistant = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => addToast('Copied', 'success'));
  };

  const runUserMessage = async (text: string) => {
    if (!readyToChat || !text.trim() || busy) return;
    const userText = text.trim();
    setInput('');
    setBusy(true);
    setMessages(m => [...m, { role: 'user', content: userText, id: uid() }]);

    const apiMsgs = apiMessagesRef.current;

    if (useCloudRef.current) {
      apiMsgs.push({ role: 'user', content: userText });
    } else {
      const contentForModel = contextInjectedRef.current
        ? userText
        : (() => {
            contextInjectedRef.current = true;
            return webllmFirstUserContent(userText);
          })();
      apiMsgs.push({ role: 'user', content: contentForModel });
    }

    let assistantText = '';

    const completeWithToolsLocal = async (eng: MLCEngine) =>
      eng.chat.completions.create({
        messages: apiMsgs,
        tools: afritrustAssistantTools,
        tool_choice: 'auto',
        temperature: 0.25,
      }) as Promise<ChatCompletionLike>;

    const completePlainLocal = async (eng: MLCEngine, extraUser?: string) => {
      const msgs = [...apiMsgs];
      if (extraUser) msgs.push({ role: 'user', content: extraUser });
      return eng.chat.completions.create({
        messages: msgs,
        temperature: 0.4,
      }) as Promise<ChatCompletionLike>;
    };

    const tryCloudThenTools = async (): Promise<ChatCompletionLike> => {
      if (!useCloudRef.current) {
        const eng = engineRef.current ?? (await ensureLocalEngine());
        return completeWithToolsLocal(eng);
      }
      try {
        return await assistantLlmChatCompletion({
          messages: apiMsgs,
          tools: afritrustAssistantTools,
          tool_choice: 'auto',
          temperature: 0.25,
        });
      } catch (e) {
        if (!assistantLlmErrorShouldFallback(e)) throw e;
        addToast('Cloud assistant unavailable — switching to the on-device model.', 'info');
        setUsingCloudAssistant(false);
        useCloudRef.current = false;
        const eng = await ensureLocalEngine();
        const firstUser = apiMsgs.find(m => m.role === 'user');
        if (firstUser && typeof firstUser.content === 'string') {
          const c = firstUser.content;
          if (!c.includes('\n---\nUser request:\n')) {
            firstUser.content = webllmFirstUserContent(c);
          }
          contextInjectedRef.current = true;
        }
        return completeWithToolsLocal(eng);
      }
    };

    const recoverParseOrTool = async (): Promise<ChatCompletionLike> => {
      const remedial =
        'The structured tool reply failed to parse. Answer the user in plain language only (no JSON, no tools).';
      if (useCloudRef.current) {
        return assistantLlmChatCompletionPlain({
          messages: [
            ...apiMsgs,
            {
              role: 'user',
              content: remedial,
            },
          ],
          temperature: 0.35,
        });
      }
      const eng = engineRef.current ?? (await ensureLocalEngine());
      return eng.chat.completions.create({
        messages: [
          ...apiMsgs,
          {
            role: 'user',
            content: remedial,
          },
        ],
        temperature: 0.35,
      }) as Promise<ChatCompletionLike>;
    };

    const completePlainHint = async (): Promise<ChatCompletionLike> => {
      const hint =
        'Give a brief plain-language answer for the user. Do not use JSON tool syntax.';
      if (useCloudRef.current) {
        return assistantLlmChatCompletionPlain({
          messages: [...apiMsgs, { role: 'user', content: hint }],
          temperature: 0.35,
        });
      }
      const eng = engineRef.current ?? (await ensureLocalEngine());
      return completePlainLocal(eng, hint);
    };

    try {
      for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
        let response: ChatCompletionLike;
        try {
          response = await tryCloudThenTools();
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (isParseOrToolError(errMsg)) {
            response = await recoverParseOrTool();
          } else {
            throw e;
          }
        }

        const choice = response.choices[0];
        const msg = choice?.message;
        if (!msg) break;

        const toolCalls = msg.tool_calls;
        if (toolCalls?.length) {
          apiMsgs.push({
            role: 'assistant',
            content: msg.content ?? null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments ?? '{}',
              },
            })),
          });

          for (const tc of toolCalls) {
            const fn = tc.function;
            const result = await executeAssistantTool(fn.name, fn.arguments ?? '{}');
            let ok = true;
            try {
              const p = JSON.parse(result) as { ok?: boolean };
              if (p && p.ok === false) ok = false;
            } catch {
              ok = false;
            }
            setToolLog(prev => [...prev, { name: fn.name, ok, preview: previewJson(result) }]);
            apiMsgs.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: result,
            });
          }
          continue;
        }

        assistantText = (typeof msg.content === 'string' ? msg.content : '')?.trim() ?? '';
        if (!assistantText) {
          const plain = await completePlainHint();
          assistantText =
            (typeof plain.choices[0]?.message?.content === 'string'
              ? plain.choices[0].message.content
              : '')?.trim() ?? '';
        }
        if (assistantText) {
          apiMsgs.push({ role: 'assistant', content: assistantText });
        }
        break;
      }

      if (assistantText) {
        setMessages(m => [...m, { role: 'assistant', content: assistantText, id: uid() }]);
      } else if (apiMsgs.at(-1)?.role === 'tool') {
        setMessages(m => [
          ...m,
          {
            role: 'assistant',
            content: 'I ran the requested actions — check the tool panel for details.',
            id: uid(),
          },
        ]);
      }
    } catch (e) {
      const err =
        e instanceof ApiError
          ? `${e.message} (${e.status})`
          : e instanceof Error
            ? e.message
            : String(e);
      setMessages(m => [...m, { role: 'assistant', content: `Something went wrong: ${err}`, id: uid() }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runUserMessage(input);
  };

  const showLocalSetupCard =
    live &&
    cloudLlmStatus !== 'loading' &&
    !((cloudLlmStatus === 'enabled' && usingCloudAssistant) || engine);

  const selectCategoryPrompt = (prompt: string) => {
    setInput(prompt);
    setActiveCategory(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const livePill = readyToChat && (
    <div className="flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row lg:items-stretch"
    >
      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white via-white to-blue-50/30 p-6 shadow-lg shadow-blue-500/[0.06] ring-1 ring-blue-100/40">
        {!live && (
          <div className="mb-6 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Connect the <strong>live API</strong> (disable{' '}
            <code className="rounded bg-white/80 px-1">VITE_USE_MOCK_API</code>).
          </div>
        )}

        <div className="mx-auto flex w-full max-w-3xl flex-col">
          {live && cloudLlmStatus === 'loading' && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
              Checking whether the cloud assistant is available…
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <AssistantOrbLogo />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-2 flex w-full max-w-lg flex-col items-center gap-3"
              >
                <div className="flex w-full flex-wrap items-center justify-center gap-3">
                  <h1 className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
                    Ready to assist you
                  </h1>
                  {livePill}
                </div>
                <p className="text-sm text-gray-500">
                  Ask about workflows, verifications, and go-live checks — or try a suggestion below.
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" strokeWidth={2} />
                <h2 className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-lg font-bold text-transparent">
                  AfriTrust assistant
                </h2>
              </div>
              {livePill}
            </div>
          )}

          {showLocalSetupCard && (
            <div className="relative mb-6 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 p-6 shadow-sm">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-lg space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                    <Zap className="h-3 w-3" />
                    On-device model
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                    {prepareCopy ? prepareCopy.title : 'Set up the local assistant'}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {prepareCopy
                      ? prepareCopy.blurb
                      : cloudLlmStatus === 'disabled'
                        ? 'Cloud assistant is not configured on the API — this browser will run a local model. One-time download; then cached for this browser.'
                        : 'One-time setup downloads the model to this browser. After that, same browser stays fast with no repeat download. New device = setup again.'}
                  </p>
                  {loadingModel && loadProgressFrac !== null && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-gray-600">
                        <span>Model cache</span>
                        <span className="tabular-nums text-blue-700">
                          {Math.round(loadProgressFrac * 100)}%
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner"
                        role="progressbar"
                        aria-valuenow={Math.round(loadProgressFrac * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Model download and cache progress"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-[width] duration-200 ease-out"
                          style={{ width: `${Math.min(100, Math.max(0, loadProgressFrac * 100))}%` }}
                        />
                      </div>
                      {loadProgress && (
                        <p className="text-[11px] leading-relaxed text-gray-500">{loadProgress}</p>
                      )}
                    </div>
                  )}
                  {!loadingModel && loadProgress && setupPhase === 'idle' && (
                    <p className="text-xs text-rose-700">{loadProgress}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <button
                    type="button"
                    disabled={loadingModel}
                    onClick={() => void loadEngine()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loadingModel ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Radio className="h-4 w-4" />
                    )}
                    {loadingModel
                      ? `Preparing… ${Math.round((loadProgressFrac ?? 0) * 100)}%`
                      : cacheStatus === 'hit'
                        ? 'Start'
                        : 'Start setup'}
                  </button>
                  <span className="text-center text-[10px] text-gray-400 sm:text-right">
                    Runs locally in this browser after setup.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              'flex min-h-[420px] w-full flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white/90 shadow-md shadow-gray-200/80 backdrop-blur-sm',
              !readyToChat && 'pointer-events-none opacity-55'
            )}
          >
            <div
              ref={scrollRef}
              className={cn(
                'relative max-h-[min(52vh,480px)] min-h-[140px] flex-1 space-y-4 overflow-y-auto bg-gray-50/40 px-4 py-4',
                messages.length > 0 && 'min-h-[260px]'
              )}
            >
              {messages.length > 1 && (
                <div
                  className="pointer-events-none absolute bottom-20 left-[2.125rem] top-10 hidden w-px bg-gradient-to-b from-blue-200/35 via-blue-100/15 to-transparent sm:block"
                  aria-hidden
                />
              )}
              {messages.length === 0 && readyToChat && (
                <p className="pt-2 text-center text-sm text-gray-400">
                  Choose a category under the composer or type your question.
                </p>
              )}
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  layout="position"
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className={cn(
                    'mx-auto flex max-w-[36rem] gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-blue-600 to-sky-500 text-white'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <span className="text-xs font-bold">You</span>
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[min(100%,32rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'rounded-tr-md bg-blue-600 text-white'
                        : 'rounded-tl-md border border-gray-200 bg-white text-gray-900'
                    )}
                  >
                    <AssistantMessageBlock
                      role={msg.role}
                      content={msg.content}
                      messageId={msg.id}
                      suggestionChecks={suggestionChecks}
                      onToggleSuggestion={onToggleSuggestion}
                    />
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => copyAssistant(msg.content)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-blue-600"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="mx-auto flex max-w-[36rem] items-center gap-3 pl-11">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                  </div>
                  <span className="text-xs text-gray-400">Thinking with tools…</span>
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-gray-100 bg-white">
              <div className="p-4 pb-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  className="max-h-36 min-h-[52px] w-full resize-none text-base text-gray-800 outline-none placeholder:text-gray-400"
                  placeholder={
                    readyToChat
                      ? 'Ask about workflows, applicants, verifications…'
                      : 'Waiting for assistant backend…'
                  }
                  value={input}
                  disabled={!readyToChat || busy}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (readyToChat && !busy && input.trim()) void runUserMessage(input);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {cloudLlmStatus === 'enabled' && usingCloudAssistant && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600">
                      Cloud
                    </span>
                  )}
                  {engine && !(cloudLlmStatus === 'enabled' && usingCloudAssistant) && (
                    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-500">
                      On-device
                    </span>
                  )}
                  {!readyToChat && cloudLlmStatus !== 'loading' && (
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
                      Setup required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowTools(s => !s)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                    title="Tool activity"
                  >
                    <Wrench className="h-5 w-5" />
                  </button>
                  <div className="relative" ref={historyRootRef}>
                    <button
                      type="button"
                      onClick={() =>
                        historyOpen ? setHistoryOpen(false) : void openHistoryPanel()
                      }
                      className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      title="Past conversations"
                      aria-expanded={historyOpen}
                      aria-haspopup="listbox"
                    >
                      <History className="h-5 w-5" strokeWidth={1.75} />
                      {(live ? remoteSessionCount > 0 : archivedCount > 0) && (
                        <span
                          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500 opacity-90 ring-2 ring-white"
                          aria-hidden
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void startNewRemoteSession()}
                      disabled={!sessionActionsReady || busy}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title="New chat (saves this one first when it has messages)"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2} />
                    </button>
                    <AnimatePresence>
                      {historyOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="absolute bottom-full right-0 z-50 mb-2 w-[min(19rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-xl shadow-blue-500/10 backdrop-blur-xl"
                          role="listbox"
                          aria-label="Past conversations"
                        >
                          <div className="border-b border-gray-100/90 bg-gradient-to-r from-blue-50/50 to-transparent px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                              Past chats
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                              {live
                                ? 'Synced to your account. Use the trash icon to delete a chat (including empty ones).'
                                : 'Stored on this device only until you use the live API.'}
                            </p>
                          </div>
                          <ul className="max-h-[min(12rem,40vh)] overflow-y-auto py-1">
                            {live ? (
                              historyRemoteItems.length === 0 ? (
                                <li className="px-3 py-7 text-center text-xs leading-relaxed text-gray-400">
                                  No saved chats yet.
                                  <br />
                                  <span className="text-[11px]">Use the + button to start one.</span>
                                </li>
                              ) : (
                                historyRemoteItems.map(s => (
                                  <li key={s.id} role="option" className="group flex items-stretch">
                                    <button
                                      type="button"
                                      className={cn(
                                        'flex min-w-0 flex-1 items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors hover:bg-blue-50/60',
                                        s.id === remoteSessionId
                                          ? 'border-blue-600 bg-blue-50/40'
                                          : 'border-transparent hover:border-blue-400/70'
                                      )}
                                      onClick={() => void selectRemoteSession(s.id)}
                                    >
                                      <span
                                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 shadow-sm"
                                        aria-hidden
                                      />
                                      <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 text-xs font-medium text-gray-800">
                                          {s.preview?.trim() || 'Chat'}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] tabular-nums text-gray-400">
                                          {formatRelativeTime(new Date(s.updated_at).getTime())}
                                        </span>
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      className="flex shrink-0 items-center justify-center px-2 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                      title="Delete chat"
                                      aria-label={`Delete chat: ${s.preview?.trim() || 'Untitled'}`}
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (
                                          typeof window !== 'undefined' &&
                                          !window.confirm('Delete this chat permanently?')
                                        ) {
                                          return;
                                        }
                                        void deleteRemoteSessionById(s.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                                    </button>
                                  </li>
                                ))
                              )
                            ) : archivedSessions.length === 0 ? (
                              <li className="px-3 py-7 text-center text-xs leading-relaxed text-gray-400">
                                Nothing saved yet.
                                <br />
                                <span className="text-[11px] text-gray-400/90">Clear the chat to add one.</span>
                              </li>
                            ) : (
                              archivedSessions.map(s => (
                                <li key={s.id} role="option">
                                  <button
                                    type="button"
                                    className="flex w-full items-start gap-2.5 border-l-2 border-transparent px-3 py-2.5 text-left transition-colors hover:border-blue-500/80 hover:bg-blue-50/50"
                                    onClick={() => applyArchivedSession(s)}
                                  >
                                    <span
                                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-sky-400"
                                      aria-hidden
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="line-clamp-2 text-xs font-medium text-gray-800">
                                        {s.preview}
                                      </span>
                                      <span className="mt-0.5 block text-[10px] tabular-nums text-gray-400">
                                        {formatRelativeTime(s.updatedAt)}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    onClick={resetConversation}
                    disabled={!readyToChat || messages.length === 0}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!readyToChat || busy || !input.trim()}
                    title="Send"
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                      input.trim() && readyToChat && !busy
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    )}
                  >
                    <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <p className="border-t border-gray-50 px-4 py-2 text-[10px] text-gray-400">
                Enter to send · Shift+Enter newline
              </p>
            </form>
          </div>

          {messages.length === 0 && readyToChat && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(Object.keys(ASSISTANT_CATEGORIES) as AssistantCategoryKey[]).map(key => {
                  const { label, Icon } = ASSISTANT_CATEGORIES[key];
                  return (
                    <AssistantCategoryTile
                      key={key}
                      label={label}
                      icon={Icon}
                      active={activeCategory === key}
                      onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                    />
                  );
                })}
              </div>
              <AnimatePresence>
                {activeCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 w-full overflow-hidden"
                  >
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-100 p-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          {CATEGORY_SUGGESTION_TITLE[activeCategory]}
                        </h3>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {ASSISTANT_CATEGORIES[activeCategory].prompts.map((suggestion, index) => {
                          const SIcon = ASSISTANT_CATEGORIES[activeCategory].Icon;
                          return (
                            <motion.li
                              key={suggestion}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.04 }}
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => selectCategoryPrompt(suggestion)}
                                className="flex w-full items-center gap-3 p-3 text-left transition-colors duration-75 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <SIcon className="h-4 w-4 shrink-0 text-blue-600" />
                                <span className="text-sm text-gray-700">{suggestion}</span>
                              </button>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <aside
        className={cn(
          'w-full shrink-0 transition-all lg:w-[300px]',
          !showTools && 'hidden lg:block'
        )}
      >
        <div className="sticky top-4 space-y-3 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Wrench className="h-4 w-4 text-blue-600" />
              API actions
            </h2>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline lg:hidden"
              onClick={() => setShowTools(false)}
            >
              Close
            </button>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            Tool calls use your dashboard session against the live AfriTrust API.
          </p>
          <ul className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto">
            {toolLog.length === 0 && (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-8 text-center text-xs text-gray-400">
                <CheckCircle2 className="h-5 w-5 text-gray-300" />
                No API calls yet — ask a question to see traces.
              </li>
            )}
            {toolLog.map((line, i) => (
              <li
                key={i}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[11px] leading-snug',
                  line.ok ? 'border-emerald-200/90 bg-emerald-50/60' : 'border-rose-200/90 bg-rose-50/60'
                )}
              >
                <span className="font-semibold text-gray-900">{line.name}</span>
                <p className="mt-1 break-all font-mono text-gray-600">{line.preview}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </motion.div>
  );
}
