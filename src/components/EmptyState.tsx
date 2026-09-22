import React from 'react';
import { Sparkles, Code2, Lightbulb, Compass, ArrowUpRight } from 'lucide-react';
import { ThemeMode, ExamplePrompt } from '../types';

interface EmptyStateProps {
  theme: ThemeMode;
  onSelectPrompt: (promptText: string) => void;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'code-help',
    title: 'Code & Debugging',
    prompt: 'Write a TypeScript function that debounces API search queries with full type safety.',
    iconName: 'Code',
  },
  {
    id: 'concept-explain',
    title: 'Explain Concepts',
    prompt: 'Explain how Large Language Models work under the hood using an everyday analogy.',
    iconName: 'Lightbulb',
  },
  {
    id: 'creative-writing',
    title: 'Productive Writing',
    prompt: 'Draft an engaging product announcement email for a new AI feature release.',
    iconName: 'Sparkles',
  },
  {
    id: 'strategy-plan',
    title: 'Strategy & Analysis',
    prompt: 'Compare relational SQL databases vs document stores for high-throughput messaging apps.',
    iconName: 'Compass',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ theme, onSelectPrompt }) => {
  const isDark = theme === 'dark';

  const getIcon = (iconName: ExamplePrompt['iconName']) => {
    switch (iconName) {
      case 'Code':
        return <Code2 className="w-5 h-5 text-emerald-400" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-violet-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-3xl mx-auto px-4 py-8 text-center animate-in fade-in duration-300">
      {/* Brand Icon Badge */}
      <div className="relative mb-5 group">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-sm opacity-70 group-hover:opacity-100 transition duration-500" />
        <div
          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            isDark
              ? 'bg-neutral-900 border-neutral-800 text-emerald-400'
              : 'bg-white border-neutral-200 text-emerald-600'
          }`}
        >
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      {/* Title & Tagline */}
      <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-2.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
        Julie AI
      </h1>
      <p className={`text-base sm:text-lg max-w-lg mb-8 font-normal leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
        How can I help you today?
      </p>

      {/* 4 Clickable Example Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
        {EXAMPLE_PROMPTS.map((item) => (
          <button
            key={item.id}
            id={`example-prompt-${item.id}`}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className={`group relative p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              isDark
                ? 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/70 hover:border-emerald-500/40 hover:shadow-lg'
                : 'bg-white border-neutral-200 hover:bg-neutral-50 hover:border-emerald-400/60 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-neutral-800 border border-neutral-700/50' : 'bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {getIcon(item.iconName)}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {item.title}
                </span>
              </div>
              <ArrowUpRight
                className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
            </div>
            <p className={`text-sm line-clamp-2 leading-relaxed font-normal ${isDark ? 'text-neutral-400 group-hover:text-neutral-200' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
              &ldquo;{item.prompt}&rdquo;
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
