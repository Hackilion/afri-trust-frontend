import { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from '../../hooks/useSettings';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { WebhookEvent } from '../../types';

const ALL_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'applicant.created', label: 'Applicant Created' },
  { value: 'applicant.verified', label: 'Applicant Verified' },
  { value: 'applicant.rejected', label: 'Applicant Rejected' },
  { value: 'applicant.needs_review', label: 'Needs Review' },
  { value: 'check.completed', label: 'Check Completed' },
];

export function WebhooksTab() {
  const { data: webhooks, isLoading } = useWebhooks();
  const { mutate: createWebhook, isPending: creating } = useCreateWebhook();
  const { mutate: deleteWebhook } = useDeleteWebhook();

  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['applicant.verified', 'applicant.rejected']);

  const toggle = (e: WebhookEvent) => setEvents(ev => ev.includes(e) ? ev.filter(x => x !== e) : [...ev, e]);

  const handleCreate = () => {
    createWebhook({ url, events }, { onSuccess: () => { setShowCreate(false); setUrl(''); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">Receive real-time event notifications to your server.</p>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Webhook
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-900">New webhook endpoint</h3>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Endpoint URL</label>
            <input type="url" placeholder="https://your-server.com/webhooks" value={url} onChange={e => setUrl(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-2">Events to send</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map(e => (
                <button key={e.value} onClick={() => toggle(e.value)} className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all', events.includes(e.value) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-gray-600 border-gray-200')}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={!url || !events.length || creating} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium disabled:opacity-50 hover:bg-indigo-700">
              {creating ? 'Saving...' : 'Save Webhook'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-50 bg-gray-50/50">
            <tr>
              {['Endpoint', 'Events', 'Status', 'Failures', 'Last triggered', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-gray-400">Loading...</td></tr>
              : webhooks?.map(wh => (
                <tr key={wh.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3.5">
                    <code className="text-[12px] font-mono text-gray-800">{wh.url}</code>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(e => <span key={e} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{e}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {wh.status === 'active'
                      ? <span className="flex items-center gap-1 text-[12px] text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      : <span className="text-[12px] text-gray-400">Disabled</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {wh.failureCount > 0
                      ? <span className="flex items-center gap-1 text-[12px] text-red-500"><AlertCircle className="w-3 h-3" /> {wh.failureCount}</span>
                      : <span className="text-[12px] text-gray-400">0</span>}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-gray-500">{wh.lastTriggeredAt ? formatRelativeTime(wh.lastTriggeredAt) : '—'}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => deleteWebhook(wh.id)} className="text-[12px] text-red-500 hover:text-red-700 font-medium"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
