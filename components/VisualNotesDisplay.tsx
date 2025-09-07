import React from 'react';
import { VisualNoteSection } from '../types';
import { NoteCard } from './NoteCard';
import { SkeletonNoteCard } from './SkeletonNoteCard';
import { SparklesIcon, ExclamationIcon } from './icons';

interface VisualNotesDisplayProps {
  notes: VisualNoteSection[] | null;
  isLoading: boolean;
  error: string | null;
  autoGenerateImages: boolean;
}

export const VisualNotesDisplay: React.FC<VisualNotesDisplayProps> = ({ notes, isLoading, error, autoGenerateImages }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <SkeletonNoteCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-lg">
        <div className="flex justify-center items-center gap-2 text-red-400">
          <ExclamationIcon />
          <h3 className="font-semibold">An Error Occurred</h3>
        </div>
        <p className="text-red-400 mt-2">{error}</p>
      </div>
    );
  }

  if (!notes) {
    return (
      <div className="text-center p-12 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
        <div className="flex justify-center items-center mb-4">
          <SparklesIcon className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Ready to Visualize</h3>
        <p className="text-gray-400 mt-2">Paste a transcript above and watch the magic happen.</p>
      </div>
    );
  }
  
  if (notes.length === 0) {
     return (
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-white">No Notes Generated</h3>
            <p className="text-gray-400 mt-2">The AI couldn't extract visual notes from the provided transcript. Please try with a different one.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {notes.map((note, index) => (
        <div
          key={`${note.title}-${index}`}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <NoteCard note={note} autoGenerate={autoGenerateImages} />
        </div>
      ))}
    </div>
  );
};