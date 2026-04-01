'use client';

import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// SSR-safe: react-md-editor uses browser APIs
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 100 }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" className="markdown-editor">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        preview="edit"
        hideToolbar={false}
        visibleDragbar={false}
        textareaProps={{ placeholder }}
        height={minHeight}
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
