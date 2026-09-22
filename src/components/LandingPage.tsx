import React from 'react';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Code2,
  FileText,
  Image as ImageIcon,
  PenTool,
  Mic,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface LandingPageProps {
  theme: ThemeMode;
  onGetStarted: () => void;
  onExplorePrompt?: (prompt: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  onGetStarted,
  onExplorePrompt,
}) => {
  const isDark = theme === 'dark';

  const capabilities = [
    {
      id: 'answer-questions',
      title: 'Answer Questions',
      description: 'Get deep, accurate, and insightful answers to any query across science, business, or history.',
      icon: HelpCircle,
      accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      samplePrompt: 'What are the key differences between classical computing and quantum computing?',
    },
    {
      id: 'explain-concepts',
      title: 'Explain Concepts',
      description: 'Break down complex technical, mathematical, or scientific ideas with intuitive metaphors.',
      icon: Lightbulb,
      accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      samplePrompt: 'Explain how Large Language Models work under the hood using an everyday analogy.',
    },
    {
      id: 'coding-debugging',
      title: 'Help with Coding & Debugging',
      description: 'Write, review, refactor, and fix code in TypeScript, Python, Rust, Go, SQL, and more.',
      icon: Code2,
      accent: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      samplePrompt: 'Write a TypeScript function that debounces API search queries with full type safety.',
    },
    {
      id: 'summarize-text',
      title: 'Summarize Text',
      description: 'Condense articles, whitepapers, transcripts, and lengthy notes into clear executive briefs.',
      icon: FileText,
      accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      samplePrompt: 'Summarize the core takeaways and action items from this project proposal.',
    },
    {
      id: 'analyze-files',
      title: 'Analyze Images & Uploaded Files',
      description: 'Attach screenshots, photos, PDFs, or documents for immediate analysis and answers.',
      icon: ImageIcon,
      accent: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      samplePrompt: 'Can you analyze this architecture diagram and suggest optimizations?',
    },
    {
      id: 'help-with-writing',
      title: 'Help with Writing',
      description: 'Draft compelling emails, blogs, marketing copy, reports, and creative narratives.',
      icon: PenTool,
      accent: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      samplePrompt: 'Draft an engaging product announcement email for a new AI feature release.',
    },
    {
      id: 'natural-conversations',
      title: 'Have Natural Conversations',
      description: 'Engage in fluid, context-aware, and productive multi-turn dialogues with Julie AI.',
      icon: MessageSquare,
      accent: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      samplePrompt: 'Let us brainstorm names and positioning for a sustainable coffee startup.',
    },
    {
      id: 'voice-input',
      title: 'Voice Input Through Microphone',
      description: 'Speak your thoughts naturally with instant live speech-to-text voice recognition.',
      icon: Mic,
      accent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      samplePrompt: 'Speak directly using the microphone button on the chat bar.',
    },
  ];

  return (
    <div
      id="julie-landing-page"
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 scrollbar-thin animate-in fade-in duration-300"
    >
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-4 sm:pt-8">
          {/* Main Logo & Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1
                id="landing-hero-heading"
                className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                Julie AI
              </h1>
            </div>

            <p
              className={`text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto text-center ${
                isDark ? 'text-neutral-300' : 'text-neutral-600'
              }`}
            >
              Your intelligent, articulate conversational partner for reasoning, coding, writing, and creative exploration.
            </p>
          </div>

          {/* Primary Call to Action: Get Started Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="landing-get-started-btn"
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-base shadow-md shadow-emerald-600/25 transition-all duration-200 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="space-y-6 pt-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2
              id="landing-capabilities-heading"
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              What can Julie AI do?
            </h2>
            <p className={`text-sm sm:text-base ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Explore the versatile cognitive and creative skills built directly into Julie AI.
            </p>
          </div>

          {/* 8 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  id={`capability-card-${cap.id}`}
                  onClick={() => {
                    if (onExplorePrompt) {
                      onExplorePrompt(cap.samplePrompt);
                    } else {
                      onGetStarted();
                    }
                  }}
                  className={`group relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isDark
                      ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-850 hover:border-emerald-500/40 hover:shadow-lg'
                      : 'bg-white border-neutral-200/90 hover:bg-neutral-50 hover:border-emerald-500/40 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${cap.accent}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Try ↵
                      </span>
                    </div>

                    <h3
                      className={`text-base font-semibold tracking-tight ${
                        isDark ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {cap.title}
                    </h3>

                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? 'text-neutral-400 group-hover:text-neutral-300' : 'text-neutral-600 group-hover:text-neutral-800'
                      }`}
                    >
                      {cap.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-inherit/40">
                    <span
                      className={`text-[11px] line-clamp-1 italic ${
                        isDark ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      &ldquo;{cap.samplePrompt}&rdquo;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Call to Action Banner */}
        <section
          className={`rounded-2xl border p-6 sm:p-8 text-center relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-b from-neutral-900/90 to-neutral-950 border-neutral-800'
              : 'bg-gradient-to-b from-emerald-50/60 to-white border-emerald-100'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Ready to experience Julie AI?
            </h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Jump straight into conversation. Speak via microphone, upload files or images, and explore anything on your mind.
            </p>
            <button
              id="landing-bottom-get-started-btn"
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>Launch Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
