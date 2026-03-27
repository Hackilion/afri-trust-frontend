import { useState } from 'react';
import {
  User, Settings, GitBranch, Shield, Key, Webhook,
  Users, FileText, CheckCircle, Eye,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { PageHeader } from '../../components/shared/PageHeader';
import { SkeletonCard } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDate } from '../../lib/formatters';
import type { AuditLog, AuditLogFilters } from '../../types';

const RESOURCE_TYPES = [
  'applicant',
  'workflow',
  'tier_profile',
  'api_key',
  'webhook_subscription',
  'team_member',
  'verification_session',
  'consent_grant',
  'document_artifact',
];

const ACTIONS = [
  'applicant.created',
  'applicant.updated',
  'applicant.deleted',
  'api_key.created',
  'api_key.revoked',
  'consent.granted',
  'consent.revoked',
  'document.uploaded',
  'identity.accessed',
  'selfie.uploaded',
  'tier_profile.created',
  'tier_profile.updated',
  'tier_profile.deleted',
  'verification.created',
  'verification.approved',
  'verification.rejected',
  'workflow.created',
  'workflow.deleted',
  'workflow.published',
  'workflow.archived',
  'workflow.cloned',
  'webhook.created',
  'webhook.deleted',
  'invite',
];

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  applicant: User,
  workflow: GitBranch,
  tier_profile: Shield,
  api_key: Key,
  webhook: Webhook,
  webhook_subscription: Webhook,
  team_member: Users,
  session: FileText,
  verification_session: FileText,
  consent_grant: CheckCircle,
  document_artifact: FileText,
};

function actionBadgeClass(action: string): string {
  if (action === 'invite') return 'bg-purple-50 text-purple-700';
  if (action.includes('reject') || action.includes('revoked') || action.includes('deleted'))
    return 'bg-red-50 text-red-700';
  if (action.includes('approved') || action.includes('granted') || action.includes('.created') || action.includes('published'))
    return 'bg-emerald-50 text-emerald-700';
  if (action.includes('updated') || action.includes('uploaded') || action.includes('accessed') || action.includes('cloned'))
    return 'bg-blue-50 text-blue-700';
  if (action.includes('archived')) return 'bg-orange-50 text-orange-700';
  return 'bg-gray-50 text-gray-700';
}

function DiffView({ diff }: { diff: Record<string, { before: unknown; after: unknown }> }) {
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(diff).map(([key, pair]) => {
        const before = pair && typeof pair === 'object' && 'before' in pair ? pair.before : undefined;
        const after = pair && typeof pair === 'object' && 'after' in pair ? pair.after : undefined;
        const isPair = before !== undefined || after !== undefined;
        return (
          <div key={key} className="text-xs font-mono bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
            <span className="text-gray-500">{key}:</span>{' '}
            {isPair ? (
              <>
                {before != null && <span className="line-through text-red-500">{String(before)}</span>}
                {before != null && after != null && <span className="text-gray-400"> → </span>}
                {after != null && <span className="text-emerald-600">{String(after)}</span>}
              </>
            ) : (
              <span className="text-gray-700">{JSON.stringify(pair)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChangesView({ changes }: { changes: Record<string, unknown> }) {
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(changes).map(([key, val]) => (
        <div key={key} className="text-xs font-mono bg-slate-50 rounded px-2 py-1.5 border border-slate-200 break-all">
          <span className="text-slate-500">{key}:</span> {JSON.stringify(val)}
        </div>
      ))}
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = RESOURCE_ICONS[log.resourceType] ?? Settings;
  const actionColor = actionBadgeClass(log.action);
  const hasDiff = !!log.diff && Object.keys(log.diff).length > 0;
  const hasChanges = !!log.changes && Object.keys(log.changes).length > 0;
  const expandable = hasDiff || hasChanges;

  return (
    <div className="group">
      <button
        type="button"
        onClick={() => expandable && setExpanded(e => !e)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
          <Icon size={13} className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium max-w-full break-all ${actionColor}`}>{log.action}</span>
            <span className="text-sm text-gray-800 font-medium truncate">{log.resourceLabel}</span>
            <span className="text-xs text-gray-400 capitalize">{log.resourceType.replace(/_/g, ' ')}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
            <span>{log.actorRole === 'system' ? 'System' : log.actor}</span>
            {log.ipAddress && <><span>·</span><span className="font-mono">{log.ipAddress}</span></>}
            <span>·</span>
            <span>{formatDate(log.createdAt)}</span>
          </div>
          {expanded && hasDiff && <DiffView diff={log.diff!} />}
          {expanded && !hasDiff && hasChanges && <ChangesView changes={log.changes!} />}
        </div>
        {expandable && (
          <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors mt-1">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAuditLogs(filters, page, PAGE_SIZE);

  const setFilter = (key: keyof AuditLogFilters, value: string) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        subtitle="Immutable record of all actions performed in your organization."
      />

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error instanceof Error ? error.message : 'Could not load audit logs.'}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Resource Type</label>
            <select
              value={filters.resourceType ?? ''}
              onChange={e => setFilter('resourceType', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {RESOURCE_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={filters.action ?? ''}
              onChange={e => setFilter('action', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filters.dateFrom?.split('T')[0] ?? ''}
              onChange={e => setFilter('dateFrom', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filters.dateTo?.split('T')[0] ?? ''}
              onChange={e => setFilter('dateTo', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && (data?.items ?? []).length === 0 && (
          <EmptyState
            icon={Eye}
            title="No audit log entries"
            description="No actions match the current filters."
          />
        )}

        {!isLoading && (data?.items ?? []).length > 0 && (
          <div className="divide-y divide-gray-100">
            {(data?.items ?? []).map(log => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5">{page} / {data.totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
