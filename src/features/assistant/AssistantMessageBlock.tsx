import { motion } from 'framer-motion';

import { cn } from '../../lib/utils';

import { AssistantMessageBody } from './AssistantMessageBody';
import { splitTrailingTaskList, taskStableId } from './splitTrailingTaskList';

type AssistantMessageBlockProps = {
  role: 'user' | 'assistant';
  content: string;
  messageId: string;
  suggestionChecks: Record<string, boolean>;
  onToggleSuggestion: (stableId: string, checked: boolean) => void;
};

export function AssistantMessageBlock({
  role,
  content,
  messageId,
  suggestionChecks,
  onToggleSuggestion,
}: AssistantMessageBlockProps) {
  if (role === 'user') {
    return <AssistantMessageBody content={content} variant="user" />;
  }

  const { body, tasks } = splitTrailingTaskList(content);

  return (
    <div className="space-y-3">
      {body.trim().length > 0 && <AssistantMessageBody content={body} variant="assistant" />}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="rounded-xl border border-blue-100/90 bg-gradient-to-br from-blue-50/95 via-white to-sky-50/40 p-3 shadow-sm"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-700/90">
            Next steps
          </p>
          <ul className="space-y-2">
            {tasks.map(t => {
              const sid = taskStableId(messageId, t.index);
              const checked =
                suggestionChecks[sid] !== undefined ? suggestionChecks[sid] : t.initialChecked;
              return (
                <li key={sid} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => onToggleSuggestion(sid, !checked)}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-gray-300 bg-white hover:border-blue-400'
                    )}
                  >
                    {checked && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path
                          d="M2.5 6l2 2 4.5-4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-[13px] leading-snug text-gray-800',
                      checked && 'text-gray-500 line-through decoration-gray-400'
                    )}
                  >
                    {t.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
