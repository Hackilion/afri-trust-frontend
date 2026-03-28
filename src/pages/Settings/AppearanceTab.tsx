import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { useOrgAppearance, usePatchOrgAppearance } from '../../hooks/useSettings';
import { useSession } from '../../hooks/useSession';
import { cn } from '../../lib/utils';

export function AppearanceTab() {
  const { workspaceOrgId, can } = useSession();
  const { data, isLoading } = useOrgAppearance();
  const { mutate: save, isPending } = usePatchOrgAppearance();
  const canEdit = can('settings.appearance.edit');

  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');

  useEffect(() => {
    if (!data) return;
    setPrimaryColor(data.primaryColor);
    setAccentColor(data.accentColor);
    setLogoUrl(data.logoUrl);
    setTagline(data.tagline);
  }, [data]);

  if (!workspaceOrgId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-sm text-amber-950">
        <p className="font-semibold">No tenant workspace selected</p>
        <p className="mt-2 text-amber-900/85">
          Pick a company in the top bar to load workspace branding for that organisation.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    save({
      primaryColor,
      accentColor,
      logoUrl: logoUrl.trim(),
      tagline: tagline.trim(),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-[13px] text-gray-500">
        Colours and tagline apply across the dashboard for your team (via session branding). Logo URL is stored for
        future header use.
      </p>

      {isLoading ? (
        <p className="text-[13px] text-gray-400">Loading workspace settings…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-medium text-gray-600 block mb-1">Primary colour</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 w-14 rounded border border-gray-200 cursor-pointer disabled:opacity-50"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  disabled={!canEdit}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono disabled:bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-600 block mb-1">Accent colour</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 w-14 rounded border border-gray-200 cursor-pointer disabled:opacity-50"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  disabled={!canEdit}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Logo URL</label>
            <input
              type="url"
              placeholder="https://…"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              disabled={!canEdit}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Tagline</label>
            <input
              type="text"
              placeholder="Short line shown with your workspace identity"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              disabled={!canEdit}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] disabled:bg-gray-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canEdit ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <Palette className="w-3.5 h-3.5" />
                {isPending ? 'Saving…' : 'Save appearance'}
              </button>
            ) : (
              <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                View only — ask an owner or admin to change workspace branding.
              </p>
            )}
          </div>

          <div
            className={cn(
              'rounded-2xl border border-gray-200 p-6 text-white shadow-lg overflow-hidden relative',
              'min-h-[140px]'
            )}
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            }}
          >
            <p className="text-[11px] uppercase tracking-wider opacity-80 mb-1">Preview</p>
            <p className="font-display text-2xl font-semibold">{data?.orgName ?? 'Your organisation'}</p>
            {tagline ? <p className="mt-2 text-sm opacity-90 max-w-md">{tagline}</p> : null}
            {logoUrl ? (
              <div className="mt-4 h-10 w-auto max-w-[180px]">
                <img src={logoUrl} alt="" className="h-full w-auto object-contain object-left" />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
