import { useCallback, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Play,
  Radio,
  RotateCcw,
  Webhook,
  Zap,
} from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useUIStore } from '../../store/uiStore';
import { organizationNameById } from '../../services/applicantService';
import {
  buildIntegrationDemoSequence,
  sampleCurlCreateSession,
  type IntegrationDemoLogEntry,
} from '../../services/integrationDemoService';
import { cn } from '../../lib/utils';

function JsonBlock({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(true);
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-950 text-left overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-900/80"
      >
        {label}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <pre className="max-h-56 overflow-auto border-t border-slate-800 p-3 text-[11px] leading-relaxed text-emerald-200/95 font-mono">
          {json}
        </pre>
      )}
    </div>
  );
}

function LogCard({ entry }: { entry: IntegrationDemoLogEntry }) {
  const icon =
    entry.kind === 'webhook' ? (
      <Webhook className="h-4 w-4 text-violet-600" />
    ) : entry.kind === 'success' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    ) : (
      <Zap className="h-4 w-4 text-amber-500" />
    );

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition-all',
        entry.kind === 'webhook'
          ? 'border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white'
          : entry.kind === 'success'
            ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 to-white'
            : 'border-slate-200/90 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          {icon}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">{entry.title}</p>
            {entry.detail ? <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{entry.detail}</p> : null}
          </div>
          <p className="font-mono text-[10px] text-slate-400">{entry.at}</p>
          {entry.request != null && <JsonBlock data={entry.request} label="Request" />}
          {entry.response != null && <JsonBlock data={entry.response} label="Response" />}
          {entry.webhookPayload != null && (
            <JsonBlock data={entry.webhookPayload} label="Webhook JSON body (AfriTrust → your server)" />
          )}
        </div>
      </div>
    </div>
  );
}

export function IntegrationDemoTab() {
  const addToast = useUIStore(s => s.addToast);
  const { workspaceOrgId } = useSession();
  const [logs, setLogs] = useState<IntegrationDemoLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);

  const orgName = workspaceOrgId ? organizationNameById(workspaceOrgId) : '';

  const runDemo = useCallback(async () => {
    if (!workspaceOrgId) return;
    setRunning(true);
    setLogs([]);
    setStepIndex(0);
    const phases = buildIntegrationDemoSequence(workspaceOrgId, orgName);

    for (let i = 0; i < phases.length; i++) {
      setStepIndex(i);
      await new Promise(r => setTimeout(r, 650 + Math.random() * 400));
      const phase = phases[i];
      const entry: IntegrationDemoLogEntry = {
        id: `log_${i}_${Date.now()}`,
        at: new Date().toISOString(),
        kind: phase.kind,
        title: phase.title,
        detail: phase.detail,
        request: phase.request,
        response: phase.response,
        webhookPayload: phase.webhookPayload,
      };
      setLogs(prev => [...prev, entry]);
    }

    setStepIndex(phases.length);
    setRunning(false);
    addToast('Demo finished — this used mock data only; no API calls were made.', 'success');
  }, [workspaceOrgId, orgName, addToast]);

  const copyCurl = () => {
    if (!workspaceOrgId) return;
    void navigator.clipboard.writeText(sampleCurlCreateSession(workspaceOrgId)).then(() => {
      addToast('Sample cURL copied — replace YOUR_TEST_SECRET_KEY with a real test key.', 'success');
    });
  };

  if (!workspaceOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold">Select a workspace first</p>
        <p className="mt-2 text-amber-800/90">
          The integration demo uses your organisation ID in sample requests. Choose a tenant in the header, then return here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-6 text-white shadow-lg shadow-indigo-900/20 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">
              <Radio className="h-3 w-3 animate-pulse" />
              Sandbox demo
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">See how AfriTrust plugs into your stack</h2>
            <p className="text-sm leading-relaxed text-indigo-100/90">
              Run a scripted walkthrough: REST calls and signed webhooks, all labelled with{' '}
              <strong className="text-white">{orgName}</strong>. Nothing leaves this browser — perfect for stakeholder demos.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 rounded-xl bg-black/20 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[12px] text-indigo-100">
              <Building2 className="h-4 w-4" />
              <span className="font-medium text-white">{orgName}</span>
            </div>
            <code className="block rounded-lg bg-black/30 px-2 py-1.5 font-mono text-[11px] text-indigo-100">{workspaceOrgId}</code>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runDemo}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-indigo-700 shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Running step {stepIndex + 1}…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Play full integration demo
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setLogs([]);
              setStepIndex(-1);
            }}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear log
          </button>
          <button
            type="button"
            onClick={copyCurl}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/15"
          >
            <Copy className="h-4 w-4" />
            Copy sample cURL
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Event log</h3>
          {logs.length === 0 && !running ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-16 text-center">
              <p className="text-sm font-medium text-slate-600">No steps yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[12px] text-slate-500">
                Press <strong className="text-slate-700">Play full integration demo</strong> to simulate auth, session creation,
                applicant webhooks, and a final status read — scoped to your organisation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(e => (
                <LogCard key={e.id} entry={e} />
              ))}
              {running && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] text-slate-600">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  Simulating next API / webhook step…
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">What you are seeing</h3>
            <ul className="mt-3 space-y-3 text-[12px] leading-relaxed text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">1.</span>
                <span>REST calls use your org ID so data never mixes between tenants.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">2.</span>
                <span>Verification sessions return a hosted URL you open in WebView or browser.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">3.</span>
                <span>Webhooks are signed — verify <code className="rounded bg-slate-100 px-1 text-[11px]">X-AfriTrust-Signature</code> on your server.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">4.</span>
                <span>Configure real endpoints under Settings → API Keys &amp; Webhooks.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold text-slate-500">Production checklist</p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              Switch to <strong>live</strong> keys, register HTTPS webhooks, enable IP allowlisting if required, and point redirect URLs to your production domains.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
