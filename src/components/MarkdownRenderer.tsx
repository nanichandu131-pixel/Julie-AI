import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  theme?: 'dark' | 'light';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div className="prose-container text-inherit text-sm md:text-base leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
            }
            return (
              <code
                className={`px-1.5 py-0.5 rounded text-xs md:text-sm font-mono ${
                  isDark
                    ? 'bg-neutral-800/90 text-emerald-400 border border-neutral-700/50'
                    : 'bg-neutral-100 text-emerald-600 border border-neutral-200'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors font-medium break-all"
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-0.5 leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="my-1.5 leading-relaxed last:mb-0 first:mt-0">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className={`text-xl font-bold mt-4 mb-2 pb-1 border-b ${isDark ? 'text-white border-neutral-700/60' : 'text-neutral-900 border-neutral-200'}`}>
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className={`text-lg font-bold mt-3 mb-1.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className={`text-base font-semibold mt-2.5 mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {children}
              </h3>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                className={`border-l-4 border-emerald-500 pl-3 py-1 my-2 rounded-r italic ${
                  isDark ? 'bg-neutral-800/40 text-neutral-300' : 'bg-neutral-50 text-neutral-700'
                }`}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className={`overflow-x-auto my-3 rounded-lg border ${isDark ? 'border-neutral-700/60' : 'border-neutral-200'}`}>
                <table className="min-w-full divide-y divide-neutral-700/60 text-left text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className={isDark ? 'bg-neutral-800/80 text-neutral-200' : 'bg-neutral-100 text-neutral-800'}>
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">{children}</th>;
          },
          td({ children }) {
            return (
              <td className={`px-3 py-2 border-t text-sm ${isDark ? 'border-neutral-700/40 text-neutral-300' : 'border-neutral-200 text-neutral-700'}`}>
                {children}
              </td>
            );
          },
          hr() {
            return <hr className={`my-3 ${isDark ? 'border-neutral-700/60' : 'border-neutral-200'}`} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
