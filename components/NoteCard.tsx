import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VisualNoteSection } from '../types';
import { generateImageFromDescription, generateColorfulImageFromDescription } from '../services/geminiService';
import { DiagramIcon, LightbulbIcon, ListIcon, PhotoIcon, LoadingSpinner, ExclamationIcon, SparklesIcon } from './icons';

interface NoteCardProps {
  note: VisualNoteSection;
  autoGenerate: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, autoGenerate }) => {
  const [imagePrompt, setImagePrompt] = useState(note.visual.description);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useColorfulStyle, setUseColorfulStyle] = useState(false);
  const didAutoGenerate = useRef(false);


  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setImageUrl(null); // Clear previous image on new generation attempt

    try {
      const url = useColorfulStyle 
        ? await generateColorfulImageFromDescription(imagePrompt)
        : await generateImageFromDescription(imagePrompt);
      setImageUrl(url);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Quota exceeded')) {
        setError("Quota exceeded. Please upgrade your Gemini API plan or try again tomorrow.");
      } else {
        setError("Failed to generate image. Try refining the prompt.");
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [imagePrompt, isGenerating, useColorfulStyle]);
  
  useEffect(() => {
    if (autoGenerate && !didAutoGenerate.current) {
      didAutoGenerate.current = true;
      handleGenerateImage();
    }
  }, [autoGenerate, handleGenerateImage]);


  return (
    <article className="group rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 p-5 hover:ring-white/20 transition relative overflow-hidden opacity-0 translate-y-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-xl font-semibold tracking-tight">{note.title}</h4>
          <p className="mt-1 text-sm text-neutral-400">{note.summary}</p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-neutral-300 ring-1 ring-white/10">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Visual
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="rounded-xl bg-neutral-950 ring-1 ring-white/10 p-3">
            <h5 className="text-xs font-medium text-neutral-300 tracking-tight">Key Points</h5>
            <ul className="mt-2 space-y-2 text-sm text-neutral-300">
              {note.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"></span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="relative rounded-xl bg-neutral-950 ring-1 ring-white/10 overflow-hidden aspect-[16/10]">
            {!imageUrl && !isGenerating && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-400">No image yet</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin"></div>
                  <p className="text-xs text-neutral-400">Generating visual...</p>
                </div>
              </div>
            )}

            {error && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30">
                    <ExclamationIcon className="h-5 w-5 text-rose-300" />
                  </div>
                  <p className="text-sm text-rose-300">Generation failed</p>
                </div>
              </div>
            )}

            {imageUrl && !isGenerating && !error && (
              <div className="absolute inset-0">
                <img src={imageUrl} alt="Generated visual" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            {/* Style Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseColorfulStyle(!useColorfulStyle)}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                  useColorfulStyle 
                    ? 'bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/30' 
                    : 'text-neutral-400 hover:text-neutral-300 ring-1 ring-white/10'
                }`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                {useColorfulStyle ? 'Colorful' : 'Clean'}
              </button>
            </div>

            {(!imageUrl || error) && (
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 ring-1 ring-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>{isGenerating ? 'Generating...' : useColorfulStyle ? 'Generate Colorful' : 'Generate'}</span>
              </button>
            )}
            
            {imageUrl && !error && !isGenerating && (
              <button
                onClick={handleGenerateImage}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 ring-1 ring-white/10 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Regenerate</span>
              </button>
            )}

            {error && !isGenerating && (
              <button
                onClick={handleGenerateImage}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 ring-1 ring-white/10 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry</span>
              </button>
            )}
          </div>
          
          <p className="mt-2 text-xs text-neutral-500">{note.visual.description}</p>
        </div>
      </div>
    </article>
  );
};