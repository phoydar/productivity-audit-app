'use client';

import { useRef } from 'react';
import { Bold, Italic, Strikethrough, List, ListOrdered, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type WrapFormat = { prefix: string; suffix: string; linePrefix?: never } | { linePrefix: string; prefix?: never; suffix?: never };

function wrapSelection(textarea: HTMLTextAreaElement, format: WrapFormat, onChange: (v: string) => void) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);

  let newText: string;
  let newStart: number;
  let newEnd: number;

  if ('linePrefix' in format) {
    // Line-level format (bullet/numbered lists): prefix each line
    const lines = selected.split('\n');
    const wrapped = lines.map((line) => `${format.linePrefix}${line}`).join('\n');
    newText = value.slice(0, start) + wrapped + value.slice(end);
    newStart = start;
    newEnd = start + wrapped.length;
  } else {
    // Inline format (bold, italic, etc.)
    const wrapped = `${format.prefix}${selected || 'text'}${format.suffix}`;
    newText = value.slice(0, start) + wrapped + value.slice(end);
    newStart = selected ? start : start + format.prefix.length;
    newEnd = selected ? start + wrapped.length : newStart + 4;
  }

  onChange(newText);

  // Restore focus and selection after React re-render
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(newStart, newEnd);
  });
}

const TOOLBAR_BUTTONS = [
  { icon: Bold,          title: 'Bold',           format: { prefix: '**', suffix: '**' } },
  { icon: Italic,        title: 'Italic',          format: { prefix: '_',  suffix: '_'  } },
  { icon: Strikethrough, title: 'Strikethrough',   format: { prefix: '~~', suffix: '~~' } },
  { icon: Code,          title: 'Inline code',     format: { prefix: '`',  suffix: '`'  } },
  { icon: List,          title: 'Bullet list',     format: { linePrefix: '- ' } },
  { icon: ListOrdered,   title: 'Numbered list',   format: { linePrefix: '1. ' } },
] as const;

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 100 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="rounded-md border border-outline-variant/20 bg-surface-container-lowest overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-container border-b border-outline-variant/20">
        {TOOLBAR_BUTTONS.map(({ icon: Icon, title, format }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={(e) => {
              // Prevent textarea from losing focus
              e.preventDefault();
              if (textareaRef.current) wrapSelection(textareaRef.current, format, onChange);
            }}
            className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight }}
        className="w-full px-4 py-2.5 bg-surface-container-lowest text-on-surface text-sm placeholder:text-outline outline-none resize-y"
      />
    </div>
  );
}

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

export function MarkdownDisplay({ content, className = '' }: MarkdownDisplayProps) {
  return (
    <div className={`entry-prose text-sm text-on-surface-variant leading-relaxed ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
