import { useState } from 'react';
import { Copy, History, Plus, Send, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { isLiveApi } from '../../lib/apiConfig';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhooks,
} from '../../hooks/useSettings';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { WebhookDeliveryRow } from '../../services/settingsService';
import type { WebhookEvent } from '../../types';

const ALL_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'applicant.created', label: 'Applicant created' },
  { value: 'applicant.updated', label: 'Applicant updated' },
  { value: 'applicant.deleted', label: 'Applicant deleted' },
  { value: 'verification.created', label: 'Verification started' },
  { value: 'verification.step_completed', label: 'Verification step done' },
  { value: 'verification.approved', label: 'Verification approved' },
  { value: 'verification.rejected', label: 'Verification rejected' },
];

export function WebhooksTab() {
  const addToast = useUIStore(s => s.addToast);
  const { data: webhooks, isLoading } = useWebhooks();
  const { mutate: createWebhook, isPending: creating } = useCreateWebhook();
  const { mutate: deleteWebhook, isPending: deleting } = useDeleteWebhook();
  const { mutate: updateWebhook, isPending: updating } = useUpdateWebhook();
  const { mutate: testWebhook, isPending: testing } = useTestWebhook();

  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['verification.approved', 'verification.rejected']);
  const [signingSecretModal, setSigningSecretModal] = useState<string | null>(null);
  const [deliveriesForId, setDeliveriesForId] = useState<string | null>(null);
  const { data: deliveries, isLoading: deliveriesLoading } = useWebhookDeliveries(deliveriesForId);

  const live = isLiveApi();

  const toggle = (e: WebhookEvent) =>
    setEvents(ev => (ev.includes(e) ? ev.filter(x => x !== e) : [...ev, e]));

  const handleCreate = () => {
    createWebhook(
      { url: url.trim(), events },
      {
        onSuccess: res => {
          setShowCreate(false);
          setUrl('');
          setEvents(['verification.approved', 'verification.rejected']);
          if (res.signingSecret) {
            setSigningSecretModal(res.signingSecret);
            addToast('Webhook created — copy the signing secret now (shown once)');
          } else {
            addToast('Webhook created');
          }
        },
      }
    );
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied`);
    } catch {
      addToast('Could not copy', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-[12px] text-indigo-950 leading-relaxed">
        <p className="font-semibold text-indigo-900 text-[13px] mb-1">How deliveries work</p>
        <p>
          AfriTrust POSTs JSON to your URL with headers{' '}
          <code className="text-[11px] bg-white/80 px-1 rounded">X-AfriTrust-Event</code> and{' '}
          <code className="text-[11px] bg-white/80 px-1 rounded">X-AfriTrust-Signature</code> (HMAC-SHA256 hex of the raw
          body using your signing secret). Verify the signature before trusting the payload.
        </p>
        {live && (
          <p className="mt-2 text-indigo-900/85">
            Pending deliveries are sent by a background worker about every 10 seconds.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[13px] text-gray-500">Receive real-time event notifications to your server.</p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add webhook
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-900">New webhook endpoint</h3>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">HTTPS URL</label>
            <input
              type="url"
              placeholder="https://your-server.com/webhooks/afritrust"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map(e => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => toggle(e.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
                    events.includes(e.value)
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!url.trim() || !events.length || creating}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium disabled:opacity-50 hover:bg-indigo-700"
            >
              {creating ? 'Saving…' : 'Save webhook'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-50 bg-gray-50/50">
            <tr>
              {['Endpoint', 'Events', 'Status', 'Failures', 'Last delivery', ''].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : !webhooks?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-gray-500">
                  No webhooks yet. Add an HTTPS endpoint and choose which events to receive.
                </td>
              </tr>
            ) : (
              webhooks.map(wh => (
                <tr key={wh.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3.5">
                    <code className="text-[12px] font-mono text-gray-800 break-all">{wh.url}</code>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(e => (
                        <span
                          key={e}
                          className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-[12px] text-gray-700">
                      <input
                        type="checkbox"
                        checked={wh.status === 'active'}
                        disabled={updating || !live}
                        onChange={() =>
                          updateWebhook({ id: wh.id, isActive: wh.status !== 'active' })
                        }
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      {wh.status === 'active' ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-gray-400">Paused</span>
                      )}
                    </label>
                    {!live && (
                      <p className="text-[10px] text-gray-400 mt-1">Toggle uses live API</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {wh.failureCount > 0 ? (
                      <span className="flex items-center gap-1 text-[12px] text-red-500">
                        <AlertCircle className="w-3 h-3" /> {wh.failureCount}
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-gray-500">
                    {wh.lastTriggeredAt ? formatRelativeTime(wh.lastTriggeredAt) : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        title="Recent deliveries"
                        onClick={() => setDeliveriesForId(wh.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Send test.ping"
                        disabled={testing || !live}
                        onClick={() => testWebhook(wh.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deleting}
                        onClick={() => deleteWebhook(wh.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(signingSecretModal)}
        onClose={() => setSigningSecretModal(null)}
        title="Signing secret"
        description="Store this in a secret manager. It is only shown once and is required to verify X-AfriTrust-Signature."
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => signingSecretModal && copyText(signingSecretModal, 'Signing secret')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700"
          >
            <Copy className="w-4 h-4" /> Copy secret
          </button>
        }
      >
        {signingSecretModal && (
          <pre className="text-[12px] font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto break-all whitespace-pre-wrap">
            {signingSecretModal}
          </pre>
        )}
      </Modal>

      <Modal
        open={Boolean(deliveriesForId)}
        onClose={() => setDeliveriesForId(null)}
        title="Recent deliveries"
        description="Latest 50 attempts for this endpoint."
        size="xl"
      >
        {deliveriesLoading ? (
          <p className="text-[13px] text-gray-500 py-6 text-center">Loading…</p>
        ) : !deliveries?.length ? (
          <p className="text-[13px] text-gray-500 py-6 text-center">No deliveries yet.</p>
        ) : (
          <ul className="space-y-2 max-h-[min(400px,55vh)] overflow-y-auto">
            {deliveries.map((d: WebhookDeliveryRow) => (
              <li
                key={d.id}
                className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-[12px] space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-indigo-700">{d.event_type}</span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase px-2 py-0.5 rounded',
                      d.status === 'delivered' && 'bg-emerald-100 text-emerald-800',
                      d.status === 'pending' && 'bg-amber-100 text-amber-800',
                      d.status === 'failed' && 'bg-red-100 text-red-800'
                    )}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-gray-500">
                  HTTP {d.last_response_code ?? '—'} · {d.attempts} attempt(s) ·{' '}
                  {formatRelativeTime(d.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
