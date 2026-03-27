import { useState, type ReactNode } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = {
  title?: string;
  children: ReactNode;
  /** If false, the panel starts collapsed. */
  defaultOpen?: boolean;
  className?: string;
  /** `data-tour` anchor for the product tour (default: tab-guide-panel). */
  dataTour?: string;
};

/**
 * Collapsible in-tab help for Settings and similar pages.
 */
export function TabGuide({
  title = 'Guide',
  children,
  defaultOpen = true,
  className,
  dataTour = 'tab-guide-panel',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}
      data-tour={dataTour}
      className={cn(
        'group rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/95 to-violet-50/40 text-left shadow-sm',
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-indigo-950 [&::-webkit-details-marker]:hidden">
        <BookOpen className="h-4 w-4 shrink-0 text-indigo-600" strokeWidth={2} />
        <span>{title}</span>
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-indigo-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 border-t border-indigo-100/80 px-4 pb-4 pt-3 text-[13px] leading-relaxed text-gray-700">
        {children}
      </div>
    </details>
  );
}
