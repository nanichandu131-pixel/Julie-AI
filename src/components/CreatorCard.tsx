import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Code2,
  Heart,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { ThemeMode } from '../types';
import creatorPhoto from '../assets/creator.jpeg';

interface CreatorCardProps {
  theme: ThemeMode;
}

const LOCAL_STORAGE_CREATOR_IMG_KEY = 'julie_ai_creator_image';

export const CreatorCard: React.FC<CreatorCardProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // Candidate URLs for the uploaded creator image in priority order
  const candidateUrls = [
    creatorPhoto,
    '/api/creator-image',
    encodeURI('/Sidda Venkata Sai Tejashree.jpeg'),
    '/creator.jpeg',
    encodeURI('/WhatsApp Image 2026-09-22 at 5.36.59 PM.jpeg'),
  ];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageSrc, setImageSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CREATOR_IMG_KEY);
      if (saved && (saved.startsWith('data:image/') || saved.startsWith('http') || saved.startsWith('/'))) {
        return saved;
      }
    } catch {
      // ignore localStorage read error
    }
    return candidateUrls[0];
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CREATOR_IMG_KEY);
      if (saved && (saved.startsWith('data:image/') || saved.startsWith('http') || saved.startsWith('/'))) {
        setImageSrc(saved);
        setImageError(false);
      } else {
        setImageSrc(candidateUrls[0]);
        setImageError(false);
      }
    } catch {
      setImageSrc(candidateUrls[0]);
      setImageError(false);
    }
  }, []);

  const handleImageError = () => {
    // If a saved custom image failed, clear it and try the official candidate images
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CREATOR_IMG_KEY);
      if (saved && imageSrc === saved) {
        localStorage.removeItem(LOCAL_STORAGE_CREATOR_IMG_KEY);
        setImageSrc(candidateUrls[0]);
        setCurrentUrlIndex(0);
        setImageError(false);
        return;
      }
    } catch {
      // ignore
    }

    if (currentUrlIndex + 1 < candidateUrls.length) {
      const nextIndex = currentUrlIndex + 1;
      setCurrentUrlIndex(nextIndex);
      setImageSrc(candidateUrls[nextIndex]);
      setImageError(false);
    } else {
      // All candidate URLs failed, fall back to "ST" placeholder
      setImageError(true);
    }
  };

  return (
    <div
      id="creator-profile-card"
      className={`relative w-full max-w-lg rounded-2xl border transition-all shadow-md overflow-hidden p-5 sm:p-6 ${
        isDark
          ? 'bg-neutral-900/95 border-neutral-750 text-neutral-100 shadow-black/40'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-neutral-200/60'
      }`}
    >
      {/* Background ambient gradient glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Tag */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Creator & Developer</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified</span>
        </div>
      </div>

      {/* Main Profile Info Row */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        {/* Profile Avatar Frame */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-sm relative bg-neutral-800 flex items-center justify-center">
            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt="Sidda Venkata Sai Tejashree"
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={handleImageError}
                className="w-full h-full object-cover object-[center_35%] transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-gradient-to-br from-emerald-800 to-teal-950 text-white">
                <span className="text-2xl font-bold tracking-tight">ST</span>
                <span className="text-[9px] text-emerald-200 mt-1 uppercase tracking-wider font-medium">
                  Creator
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-inherit">
              Sidda Venkata Sai Tejashree
            </h3>
          </div>

          <p className="text-xs sm:text-sm font-medium text-emerald-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Creator & Lead Developer of Julie AI</span>
          </p>

          <p
            className={`text-xs sm:text-sm mt-2.5 leading-relaxed ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}
          >
            Sidda Venkata Sai Tejashree designed, developed, and crafted Julie AI to provide an articulate, fast, and friendly conversational AI assistant experience.
          </p>
        </div>
      </div>

      {/* Highlights / Badges */}
      <div className="mt-4 pt-3.5 border-t border-inherit flex flex-wrap items-center gap-2 text-xs">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300'
              : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Julie AI Creator</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300'
              : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-teal-500" />
          <span>Full-Stack Architecture</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300'
              : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Built with Pride</span>
        </div>
      </div>
    </div>
  );
};
