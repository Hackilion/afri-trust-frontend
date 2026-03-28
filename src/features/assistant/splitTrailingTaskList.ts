/** Pulls a trailing GFM task list off assistant markdown so we can render real checkboxes with stable IDs. */

export type ParsedTaskLine = {
  /** Stable within the message when order is unchanged */
  index: number;
  label: string;
  /** From model output [ ] / [x] */
  initialChecked: boolean;
};

export function splitTrailingTaskList(content: string): {
  body: string;
  tasks: ParsedTaskLine[];
} {
  const raw = content.replace(/\s+$/, '');
  if (!raw) return { body: '', tasks: [] };

  const lines = raw.split('\n');
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') end--;

  let start = end;
  while (start > 0) {
    const line = lines[start - 1];
    if (line.trim() === '') {
      start--;
      continue;
    }
    if (/^\s*[-*]\s+\[[ xX]\]\s*.+/.test(line)) {
      start--;
      continue;
    }
    break;
  }

  if (end <= start) return { body: content, tasks: [] };

  const taskSlice = lines.slice(start, end);
  const tasks: ParsedTaskLine[] = [];
  for (let i = 0; i < taskSlice.length; i++) {
    const line = taskSlice[i];
    const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s*(.+)$/);
    if (m) {
      tasks.push({
        index: tasks.length,
        label: m[2].trim(),
        initialChecked: /[xX]/.test(m[1]),
      });
    }
  }

  if (tasks.length === 0) return { body: content, tasks: [] };

  const body = lines.slice(0, start).join('\n').replace(/\s+$/, '');
  return { body, tasks };
}

export function taskStableId(messageId: string, taskIndex: number): string {
  return `${messageId}-s-${taskIndex}`;
}
