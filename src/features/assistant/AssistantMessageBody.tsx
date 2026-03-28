import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '../../lib/utils';

function markdownComponents(variant: 'assistant' | 'user'): Partial<Components> {
  const isUser = variant === 'user';
  const linkClass = isUser
    ? 'font-medium text-blue-100 underline decoration-blue-200/80 underline-offset-2 hover:text-white'
    : 'font-medium text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700';
  const inlineCodeClass = isUser
    ? 'rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-[0.8125rem] text-white'
    : 'rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.8125rem] text-gray-800';
  const blockPreClass = isUser
    ? 'my-2 overflow-x-auto rounded-lg border border-white/25 bg-blue-950/90 p-3 text-[13px] text-gray-100'
    : 'my-2 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-3 text-[13px] text-gray-100';
  const strongClass = isUser ? 'font-semibold text-white' : 'font-semibold text-gray-950';

  return {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul
        className={cn(
          'mb-2 list-disc pl-4 last:mb-0',
          isUser ? 'marker:text-blue-200' : 'marker:text-gray-500'
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={cn(
          'mb-2 list-decimal pl-4 last:mb-0',
          isUser ? 'marker:text-blue-100' : 'marker:text-gray-600'
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="my-0.5 [&>p]:mb-0">{children}</li>,
    strong: ({ children }) => <strong className={strongClass}>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    del: ({ children }) => (
      <del className={cn('line-through opacity-80', isUser && 'text-blue-200')}>{children}</del>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ),
    h1: ({ children }) => (
      <h3 className={cn('mb-2 mt-3 text-base font-semibold first:mt-0', strongClass)}>{children}</h3>
    ),
    h2: ({ children }) => (
      <h3 className={cn('mb-2 mt-3 text-base font-semibold first:mt-0', strongClass)}>{children}</h3>
    ),
    h3: ({ children }) => (
      <h3 className={cn('mb-1.5 mt-2 text-sm font-semibold first:mt-0', strongClass)}>{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          'my-2 border-l-2 pl-3 italic',
          isUser ? 'border-white/40 text-blue-50' : 'border-blue-200 text-gray-600'
        )}
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr
        className={cn('my-3', isUser ? 'border-white/25' : 'border-gray-200')}
      />
    ),
    table: ({ children }) => (
      <div
        className={cn(
          'my-2 max-w-full overflow-x-auto rounded-lg border',
          isUser ? 'border-white/25' : 'border-gray-200'
        )}
      >
        <table className="min-w-full border-collapse text-left text-[13px]">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isUser ? 'bg-white/10' : 'bg-gray-50'}>{children}</thead>
    ),
    th: ({ children }) => (
      <th
        className={cn(
          'border px-2 py-1.5 font-semibold',
          isUser ? 'border-white/20 text-white' : 'border-gray-200 text-gray-900'
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={cn(
          'border px-2 py-1.5 align-top',
          isUser ? 'border-white/15 text-blue-50' : 'border-gray-200 text-gray-800'
        )}
      >
        {children}
      </td>
    ),
    tr: ({ children }) => <tr className={isUser ? 'even:bg-white/5' : 'even:bg-gray-50/80'}>{children}</tr>,
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt ?? ''}
        className="my-2 max-h-64 max-w-full rounded-lg border border-gray-200 object-contain"
        loading="lazy"
      />
    ),
    input: ({ type, checked, disabled, ...props }) =>
      type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={!!checked}
          readOnly
          disabled={disabled}
          className="mr-1.5 align-middle"
          {...props}
        />
      ) : (
        <input type={type} {...props} />
      ),
    code: ({ className, children, ...props }) => {
      const isBlock = /\blanguage-[\w-]+\b/.test(className ?? '');
      if (isBlock) {
        return (
          <code
            className={cn('block whitespace-pre font-mono leading-relaxed text-inherit', className)}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={inlineCodeClass} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => <pre className={blockPreClass}>{children}</pre>,
  };
}

type AssistantMessageBodyProps = {
  content: string;
  variant: 'assistant' | 'user';
};

/**
 * Renders assistant messages as GitHub-flavored Markdown (lists, tables, fenced code, links).
 * User bubbles use the same parser so pasted formatting stays readable on the blue background.
 */
export function AssistantMessageBody({ content, variant }: AssistantMessageBodyProps) {
  return (
    <div
      className={cn(
        'min-w-0 text-sm leading-relaxed',
        variant === 'user' && 'text-white [&_a]:break-all'
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(variant)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
