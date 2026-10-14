import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface QuizResultProps {
  onGoHome: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({ onGoHome }) => (
  <div className="max-w-xl mx-auto px-4 py-16">
    <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-10 text-center shadow-xs">
      <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Successfully submitted
      </h1>
      <p className="text-sm text-slate-600 mb-7">
        Your answers have been recorded. Thank you for participating.
      </p>
      <button
        onClick={onGoHome}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
      >
        Return to Competitions
      </button>
    </div>
  </div>
);
