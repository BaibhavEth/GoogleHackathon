import React from 'react';

export const SkeletonNoteCard: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden p-6 animate-pulse">
      <div className="space-y-4">
        {/* Title */}
        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
        {/* Summary */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
        
        {/* Key Points */}
        <div className="space-y-3 pt-4">
          <div className="h-5 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2 pl-6">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-4/5"></div>
          </div>
        </div>

        {/* Visual Idea */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col gap-4">
          <div className="h-5 bg-gray-700 rounded w-1/3"></div>
          <div className="w-full aspect-square bg-gray-700 rounded-md"></div>
          <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
};