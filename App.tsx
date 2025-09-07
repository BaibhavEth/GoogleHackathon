import React, { useState, useCallback } from 'react';
import { VisualNoteSection } from './types';
import { generateVisualNotes } from './services/geminiService';
import { fetchYouTubeTranscript, isYouTubeUrl } from './services/youtubeService';
import { VisualNotesDisplay } from './components/VisualNotesDisplay';
import { YouTubeIcon, SparklesIcon, LoadingSpinner } from './components/icons';

type AppStep = 'input' | 'processing' | 'results';
type InputMode = 'url' | 'manual';

const App: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [visualNotes, setVisualNotes] = useState<VisualNoteSection[] | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');

  const handleProcessVideo = useCallback(async () => {
    if (inputMode === 'url') {
      if (!youtubeUrl.trim() || isProcessing) {
        setError("Please enter a valid YouTube URL.");
        return;
      }

      if (!isYouTubeUrl(youtubeUrl)) {
        setError("Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=...)");
        return;
      }
    } else {
      if (!transcript.trim() || isProcessing) {
        setError("Please paste a transcript before generating notes.");
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setCurrentStep('processing');

    try {
      let finalTranscript = transcript;
      let title = 'Manual Transcript';

      if (inputMode === 'url') {
        // Stage 1: Fetch transcript
        setProcessingStage('Fetching transcript from YouTube...');
        const result = await fetchYouTubeTranscript(youtubeUrl);
        finalTranscript = result.transcript;
        title = result.videoTitle || 'YouTube Video';
        setTranscript(finalTranscript);
      } else {
        // For manual transcripts, show a brief processing message
        setProcessingStage('Processing your transcript...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setVideoTitle(title);
      
      // Stage 2: Generate visual notes
      setProcessingStage('Analyzing content and generating visual notes...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
      const notes = await generateVisualNotes(finalTranscript);
      setVisualNotes(notes);
      
      // Stage 3: Complete
      setProcessingStage('Finalizing your visual notes...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('results');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process content.');
      setCurrentStep('input');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  }, [youtubeUrl, transcript, inputMode, isProcessing]);

  const handleStartOver = useCallback(() => {
    setCurrentStep('input');
    setYoutubeUrl('');
    setTranscript('');
    setVisualNotes(null);
    setError(null);
    setVideoTitle('');
    setInputMode('url');
  }, []);

  // Input Step Component
  const renderInputStep = () => (
    <div className="relative z-10">
      {/* Background visuals */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20"
             style={{background: "radial-gradient(60% 60% at 50% 50%, rgba(99,102,241,0.5), rgba(99,102,241,0) 70%)"}}></div>
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-20"
             style={{background: "radial-gradient(60% 60% at 50% 50%, rgba(14,165,233,0.5), rgba(14,165,233,0) 70%)"}}></div>
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 1px)", backgroundSize: "24px 24px"}}></div>
      </div>

      {/* Top Nav / Logo */}
      <div className="mx-auto max-w-7xl px-6 pt-8 md:pt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-neutral-900 ring-1 ring-white/10 flex items-center justify-center">
              <span className="text-sm font-medium tracking-tight text-indigo-300">AVN</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-semibold tracking-tight">AI Visual Notes</span>
              <span className="text-xs text-neutral-400">Structured visual notes, instantly</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 ring-1 ring-white/10">
              <SparklesIcon className="h-4 w-4" />
              <span>Privacy-first</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-10 md:pt-14">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight opacity-0 translate-y-4 animate-fade-in-up">
            Transform any content into visual notes
          </h1>
          <p className="mt-3 text-base sm:text-lg text-neutral-400 max-w-2xl opacity-0 translate-y-4 animate-fade-in-up animation-delay-75">
            Convert YouTube videos or pasted transcripts into organized, shareable visual notes with AI-generated diagrams.
          </p>
        </div>

        <div className="mt-10 rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 backdrop-blur-sm p-4 sm:p-6 opacity-0 translate-y-4 animate-fade-in-up animation-delay-150">
          {/* Mode Toggle */}
          <div className="w-full flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-neutral-950 ring-1 ring-white/10 p-1">
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`group relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white focus:outline-none transition ${
                  inputMode === 'url' ? 'text-white' : ''
                }`}
              >
                <div className={`absolute inset-0 rounded-lg bg-white/5 ${inputMode === 'url' ? 'opacity-100' : 'opacity-0'}`}></div>
                <YouTubeIcon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">YouTube Video</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`group relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white focus:outline-none transition ${
                  inputMode === 'manual' ? 'text-white' : ''
                }`}
              >
                <div className={`absolute inset-0 rounded-lg bg-white/5 ${inputMode === 'manual' ? 'opacity-100' : 'opacity-0'}`}></div>
                <svg className="h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="relative z-10">Manual Transcript</span>
              </button>
            </div>
          </div>

          {inputMode === 'url' ? (
            /* YouTube URL Input */
            <div className="mt-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-neutral-950 ring-1 ring-white/10 px-3.5 py-2.5 focus-within:ring-indigo-500/50 transition">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-transparent outline-none placeholder:text-neutral-500 text-sm md:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleProcessVideo()}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">
                    We'll automatically extract the transcript and generate visual notes.
                  </p>
                  {error && (
                    <p className="text-xs text-rose-400">{error}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Manual Transcript Input */
            <div className="mt-6">
              <div className="rounded-xl bg-neutral-950 ring-1 ring-white/10 p-3 focus-within:ring-indigo-500/50 transition">
                <textarea
                  rows={8}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your transcript here... (from Zoom meetings, podcasts, lectures, etc.)"
                  className="w-full bg-transparent outline-none placeholder:text-neutral-500 text-sm md:text-base resize-y min-h-[160px]"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs text-neutral-300 ring-1 ring-white/10">Zoom meetings</span>
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs text-neutral-300 ring-1 ring-white/10">Podcasts</span>
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs text-neutral-300 ring-1 ring-white/10">Lectures</span>
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs text-neutral-300 ring-1 ring-white/10">Interviews</span>
                </div>
                <p className="mt-2 text-xs text-neutral-400">Perfect for Zoom meetings, podcasts, lectures, or any other transcribed content.</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleProcessVideo}
              disabled={inputMode === 'url' ? !youtubeUrl.trim() : !transcript.trim()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white ring-1 ring-indigo-500/30 disabled:bg-neutral-800 disabled:text-neutral-400 disabled:ring-white/10 transition focus:outline-none"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Create Visual Notes</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Footnote */}
          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-neutral-500">
            <div className="inline-flex items-center gap-2">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Powered by AI</span>
            </div>
            <span className="opacity-30">•</span>
            <div className="inline-flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>No data stored by default</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Processing Step Component
  const renderProcessingStep = () => (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 ring-1 ring-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-neutral-950 ring-1 ring-white/10 flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-indigo-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">Creating your visual notes</h2>
            <p className="text-sm text-neutral-400 mt-0.5">{processingStage || 'Preparing...'}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
            <div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500"></div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Hang tight — this usually takes a few seconds.</span>
        </div>
      </div>
    </div>
  );

  // Results Step Component  
  const renderResultsStep = () => (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 relative z-50">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Visual Notes</p>
              <h3 className="truncate text-lg sm:text-xl font-semibold tracking-tight">{videoTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 ring-1 ring-white/10 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>New Video</span>
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5"></div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {visualNotes ? (
          <VisualNotesDisplay
            notes={visualNotes}
            isLoading={false}
            error={null}
            autoGenerateImages={true}
          />
        ) : (
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-white">Loading Notes...</h3>
            <p className="text-neutral-400 mt-2">Please wait while we prepare your visual notes.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Main render logic
  
  if (currentStep === 'input') {
    return renderInputStep();
  }
  
  if (currentStep === 'processing') {
    return renderProcessingStep();
  }
  
  if (currentStep === 'results') {
    return renderResultsStep();
  }
  
  // Fallback
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Loading...</h3>
        <p className="text-neutral-400 mt-2">Current step: {currentStep}</p>
      </div>
    </div>
  );
};

export default App;