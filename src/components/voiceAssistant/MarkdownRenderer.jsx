import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * Robust Zero-Dependency Markdown & Code Block Renderer
 * Formats LLM responses with:
 * - Fenced code blocks with language labels and 1-click Copy Code
 * - Headings (#, ##, ###)
 * - Bullet lists and numbered lists
 * - Bold (**bold**) and italic (*italic*)
 * - Inline code (`code`)
 * - Blockquotes (> quote)
 */

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-100 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono uppercase font-bold tracking-wider text-[11px] text-emerald-300">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-emerald-200/90 scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineFormatting(text) {
  // Split on inline code, bold, italics
  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  // Simple parser for `code`, **bold**, *italic*
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-mono text-xs font-semibold"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-extrabold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Split into lines while detecting triple backtick code blocks
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code fence start/end
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockBuffer = [];
      } else {
        // End code block
        elements.push(
          <CodeBlock
            key={`cb-${i}`}
            language={codeBlockLang}
            code={codeBlockBuffer.join('\n')}
          />
        );
        inCodeBlock = false;
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-emerald-950 mt-3 mb-1">
          {renderInlineFormatting(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-extrabold text-emerald-950 mt-4 mb-1.5 border-b border-emerald-100 pb-1">
          {renderInlineFormatting(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-black text-emerald-950 mt-4 mb-2">
          {renderInlineFormatting(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith('> ')) {
      // Blockquote
      elements.push(
        <blockquote key={`bq-${i}`} className="pl-3 py-1 my-2 border-l-4 border-emerald-500 bg-emerald-50/60 rounded-r-lg text-slate-700 italic text-xs">
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
    } else if (/^[-*•]\s/.test(trimmed)) {
      // Bullet list item
      elements.push(
        <div key={`li-${i}`} className="flex items-start space-x-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
          <span className="text-xs sm:text-sm text-slate-800 leading-relaxed flex-1">
            {renderInlineFormatting(trimmed.replace(/^[-*•]\s+/, ''))}
          </span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list item
      const numMatch = trimmed.match(/^(\d+)\.\s+/);
      const num = numMatch ? numMatch[1] : '1';
      elements.push(
        <div key={`nli-${i}`} className="flex items-start space-x-2 my-1 pl-1">
          <span className="text-xs font-bold text-emerald-700 shrink-0 mt-0.5">
            {num}.
          </span>
          <span className="text-xs sm:text-sm text-slate-800 leading-relaxed flex-1">
            {renderInlineFormatting(trimmed.replace(/^\d+\.\s+/, ''))}
          </span>
        </div>
      );
    } else if (trimmed === '') {
      // Empty line / paragraph break
      elements.push(<div key={`sp-${i}`} className="h-2" />);
    } else {
      // Standard paragraph line
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm text-slate-800 leading-relaxed my-0.5">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }

  // Flush any unclosed code block safely
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key="cb-unclosed"
        language={codeBlockLang}
        code={codeBlockBuffer.join('\n')}
      />
    );
  }

  return <div className="space-y-1">{elements}</div>;
}
