import { RotateCcw } from 'lucide-react';
import { useProductTourStore } from '../../store/productTourStore';
import { useSessionStore } from '../../store/sessionStore';
import { cn } from '../../lib/utils';

/** Bottom-right control to restart the getting started product tour. */
export function HelpHub() {
  const user = useSessionStore(s => s.user);
  const requestReplay = useProductTourStore(s => s.requestProductTourReplay);

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={() => requestReplay()}
      className={cn(
        'fixed bottom-6 right-6 z-[100] inline-flex items-center gap-2 rounded-full',
        'bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/25 ring-2 ring-white',
        'hover:bg-indigo-500 transition-colors'
      )}
      aria-label="Restart tour"
      title="Restart tour"
    >
      <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      Restart tour
    </button>
  );
}
