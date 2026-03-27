import type { ChatCompletionMessageParam, MLCEngine } from '@mlc-ai/web-llm';
import {
  ArrowDown,
  Bot,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  afritrustAssistantTools,
  ASSISTANT_MODEL_DEFAULT,
  executeAssistantTool,
} from '../../features/assistant/afritrustAssistantTools';
import { isLiveApi } from '../../lib/apiConfig';
import { cn } from '../../lib/utils';
import { useSession } from '../../hooks/useSession';
import { useUIStore } from '../../store/uiStore';

/**
 * Injected once as part of the first user turn. Hermes-2-Pro + tools forbids a custom
 * `role: system` message — WebLLM injects the function-calling system prompt itself.
 */
const AFRI_USER_CONTEXT = `You are the AfriTrust dashboard copilot. Use tools for real org data.
Never invent UUIDs — call list_workflows, list_tier_profiles, or list_verifications first when needed.
Workflows must be published before create_verification_session. Summarize tool results in plain language and explain API errors briefly.`;

const MAX_AGENT_TURNS = 10;

const SUGGESTED_PROMPTS = [
  'List my published workflows',
  'Show recent verification sessions',
  'What tier profiles do we have?',
  'Summarize what I should do before going live with KYC',
];

type UiMessage = { role: 'user' | 'assistant'; content: string; id: string };
type ToolLogLine = { name: string; ok: boolean; preview: string };
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

export default function AssistantPage() {
  const { user } = useSession();
  const addToast = useUIStore(s => s.addToast);
  const live = isLiveApi();

  const [modelId] = useState(ASSISTANT_MODEL_DEFAULT);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [loadProgress, setLoadProgress] = useState('');
  /** 0–1 from WebLLM `initProgressCallback`; drives the setup progress bar. */
  const [loadProgressFrac, setLoadProgressFrac] = useState<number | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'unknown' | 'hit' | 'miss'>('unknown');
  const [setupPhase, setSetupPhase] = useState<SetupPhase>('idle');
  const loadInFlight = useRef(false);
  const notifiedReady = useRef(false);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [toolLog, setToolLog] = useState<ToolLogLine[]>([]);
  const [showTools, setShowTools] = useState(true);

  const apiMessagesRef = useRef<ChatCompletionMessageParam[]>([]);
  const contextInjectedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prepareCopy = loadingModel ? setupPrepareCopy(loadProgressFrac) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const loadEngine = useCallback(async () => {
    if (!live || engine || loadInFlight.current) return;
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
      setEngine(eng);
      setLoadProgress('');
      setLoadProgressFrac(null);
      setSetupPhase('ready');
      if (!notifiedReady.current) {
        notifiedReady.current = true;
        addToast('Assistant is ready — start chatting.', 'success');
      }
    } catch (e) {
      setSetupPhase('idle');
      setLoadProgressFrac(null);
      setLoadProgress(e instanceof Error ? e.message : String(e));
    } finally {
      loadInFlight.current = false;
      setLoadingModel(false);
    }
  }, [live, engine, modelId, addToast]);

  useEffect(() => {
    if (!live) return;
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
  }, [live, modelId, loadEngine]);

  useEffect(() => {
    if (engine && setupPhase !== 'ready') setSetupPhase('ready');
  }, [engine, setupPhase]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setToolLog([]);
    apiMessagesRef.current = [];
    contextInjectedRef.current = false;
    addToast('Conversation cleared', 'success');
  }, [addToast]);

  const copyAssistant = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => addToast('Copied', 'success'));
  };

  const runUserMessage = async (text: string) => {
    if (!engine || !text.trim() || busy) return;
    const userText = text.trim();
    setInput('');
    setBusy(true);
    setMessages(m => [...m, { role: 'user', content: userText, id: uid() }]);

    const apiMsgs = apiMessagesRef.current;
    const contentForModel = contextInjectedRef.current
      ? userText
      : (() => {
          contextInjectedRef.current = true;
          return `${AFRI_USER_CONTEXT}\n\n---\nUser request:\n${userText}`;
        })();
    apiMsgs.push({ role: 'user', content: contentForModel });

    let assistantText = '';

    const completeWithTools = async () =>
      engine.chat.completions.create({
        messages: apiMsgs,
        tools: afritrustAssistantTools,
        tool_choice: 'auto',
        temperature: 0.25,
      });

    const completePlain = async (extraUser?: string) => {
      const msgs = [...apiMsgs];
      if (extraUser) msgs.push({ role: 'user', content: extraUser });
      return engine.chat.completions.create({
        messages: msgs,
        temperature: 0.4,
      });
    };

    try {
      for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
        let response;
        try {
          response = await completeWithTools();
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (isParseOrToolError(errMsg)) {
            response = await engine.chat.completions.create({
              messages: [
                ...apiMsgs,
                {
                  role: 'user',
                  content:
                    'The structured tool reply failed to parse. Answer the user in plain language only (no JSON, no tools).',
                },
              ],
              temperature: 0.35,
            });
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
            tool_calls: toolCalls,
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
          const plain = await completePlain(
            'Give a brief plain-language answer for the user. Do not use JSON tool syntax.'
          );
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
      const err = e instanceof Error ? e.message : String(e);
      setMessages(m => [...m, { role: 'assistant', content: `Something went wrong: ${err}`, id: uid() }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runUserMessage(input);
  };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch min-h-[calc(100vh-8rem)]">
      <div className="min-w-0 flex-1 flex flex-col gap-4">
        {/* Header — minimal */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0f0f14] flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
              Agentic assistant
            </h1>
            <p className="mt-1.5 text-sm text-[#6b6b80] max-w-xl">
              On-device Llama 3 · uses your session to run AfriTrust safely ·{' '}
              <span className="text-[#454560]">{user?.email ?? '—'}</span>
            </p>
          </div>
          {engine && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </div>
          )}
        </div>

        {!live && (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Connect the <strong>live API</strong> (disable <code className="rounded bg-white/80 px-1">VITE_USE_MOCK_API</code>
            ).
          </div>
        )}

        {/* Setup card */}
        {live && !engine && (
          <div className="relative overflow-hidden rounded-2xl border border-[#e4e4f0] bg-gradient-to-br from-[#fafaff] via-white to-violet-50/40 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.35)]">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 max-w-lg">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                  <Zap className="h-3 w-3" />
                  Productivity
                </div>
                <h2 className="text-lg font-semibold text-[#12121a] tracking-tight">
                  {prepareCopy
                    ? prepareCopy.title
                    : 'Set up your agentic assistant'}
                </h2>
                <p className="text-sm leading-relaxed text-[#5c5c72]">
                  {prepareCopy
                    ? prepareCopy.blurb
                    : 'One-time setup downloads the model to this browser. After that, same browser stays fast with no repeat download. New device = setup again.'}
                </p>
                {loadingModel && loadProgressFrac !== null && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#5c5c72]">
                      <span>Model cache</span>
                      <span className="tabular-nums text-indigo-700">
                        {Math.round(loadProgressFrac * 100)}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-[#e4e4f0] shadow-inner"
                      role="progressbar"
                      aria-valuenow={Math.round(loadProgressFrac * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Model download and cache progress"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-[width] duration-200 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, loadProgressFrac * 100))}%` }}
                      />
                    </div>
                    {loadProgress && (
                      <p className="text-[11px] leading-relaxed text-[#6b6b80]">{loadProgress}</p>
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12121a] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2d2d3d] disabled:opacity-60"
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
                <span className="text-center text-[10px] text-[#8b8b9e] sm:text-right">
                  Model · <span className="font-mono text-[#5c5c72]">{modelId.split('-').slice(0, 4).join('-')}…</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#e8e8f0] bg-white shadow-sm min-h-[420px]',
            !engine && 'opacity-60 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between border-b border-[#f0f0f8] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1a1a24]">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Chat
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowTools(s => !s)}
                className="rounded-lg p-2 text-[#6b6b80] hover:bg-[#f4f4fa] lg:hidden"
                title="Tools"
              >
                <Wrench className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetConversation}
                disabled={!engine || messages.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#6b6b80] hover:bg-[#f4f4fa] disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#fafaff]/80">
            {messages.length === 0 && engine && (
              <div className="space-y-4">
                <p className="text-sm text-[#6b6b80]">Try one tap:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map(p => (
                    <button
                      key={p}
                      type="button"
                      disabled={busy}
                      onClick={() => void runUserMessage(p)}
                      className="rounded-full border border-[#e4e4f0] bg-white px-3.5 py-2 text-left text-xs font-medium text-[#3a3a4d] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                  )}
                >
                  {msg.role === 'user' ? <span className="text-xs font-bold">You</span> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    'max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-md'
                      : 'border border-[#ececf5] bg-white text-[#1a1a24] rounded-tl-md'
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyAssistant(msg.content)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#8b8b9e] hover:text-indigo-600"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-3 pl-11">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                </div>
                <span className="text-xs text-[#8b8b9e]">Thinking with tools…</span>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-[#f0f0f8] bg-white p-3">
            <div className="flex gap-2 rounded-xl border border-[#e8e8f0] bg-[#fafaff] p-1.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15">
              <textarea
                rows={1}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#1a1a24] outline-none placeholder:text-[#9a9aac]"
                placeholder={engine ? 'Ask anything — workflows, applicants, verifications…' : 'Complete setup to chat'}
                value={input}
                disabled={!engine || busy}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (engine && !busy && input.trim()) void runUserMessage(input);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!engine || busy || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#12121a] text-white transition hover:bg-[#2d2d3d] disabled:opacity-35"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-[#9a9aac]">
              <ArrowDown className="h-3 w-3" />
              Enter to send · Shift+Enter newline
            </p>
          </form>
        </div>
      </div>

      {/* Tools sidebar */}
      <aside
        className={cn(
          'w-full shrink-0 lg:w-[300px] transition-all',
          !showTools && 'hidden lg:block'
        )}
      >
        <div className="sticky top-4 space-y-3 rounded-2xl border border-[#e8e8f0] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#12121a] flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-500" />
              Actions
            </h2>
            <button
              type="button"
              className="text-xs text-indigo-600 hover:underline lg:hidden"
              onClick={() => setShowTools(false)}
            >
              Close
            </button>
          </div>
          <p className="text-xs leading-relaxed text-[#6b6b80]">
            Each step the model calls the real AfriTrust API (same permissions as your account).
          </p>
          <ul className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto">
            {toolLog.length === 0 && (
              <li className="flex items-center gap-2 rounded-xl border border-dashed border-[#e4e4f0] bg-[#fafaff] px-3 py-6 text-center text-xs text-[#9a9aac]">
                <CheckCircle2 className="mx-auto h-5 w-5 text-[#d4d4e0]" />
                No API calls yet — ask a question to see tool traces.
              </li>
            )}
            {toolLog.map((line, i) => (
              <li
                key={i}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[11px] leading-snug',
                  line.ok ? 'border-emerald-200/80 bg-emerald-50/50' : 'border-rose-200/80 bg-rose-50/50'
                )}
              >
                <span className="font-semibold text-[#12121a]">{line.name}</span>
                <p className="mt-1 break-all font-mono text-[#5c5c72]">{line.preview}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
