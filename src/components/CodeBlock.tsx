import React, { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', code }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = typeof code === 'string' ? code.replace(/\n$/, '') : String(code);
  const lang = (language || 'text').toLowerCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const getHighlightedCode = () => {
    try {
      const grammar = Prism.languages[lang] || Prism.languages.javascript || Prism.languages.clike;
      if (grammar) {
        return Prism.highlight(cleanCode, grammar, lang);
      }
    } catch (e) {
      // Fallback to text
    }
    return null;
  };

  const highlightedHtml = getHighlightedCode();

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-neutral-700/60 bg-neutral-900/90 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800/80 border-b border-neutral-700/50 text-xs font-mono text-neutral-400">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-neutral-300">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-700/60 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-sm font-mono text-neutral-200 leading-relaxed scrollbar-thin">
        {highlightedHtml ? (
          <pre className="!bg-transparent !m-0 !p-0">
            <code
              className={`language-${lang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="!bg-transparent !m-0 !p-0">
            <code className={`language-${lang}`}>{cleanCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
