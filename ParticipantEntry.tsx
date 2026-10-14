import React, { useState, useEffect } from 'react';
import { Clock, HelpCircle, CheckCircle2, AlertCircle, Sparkles, BookOpen, User, Phone, ArrowRight } from 'lucide-react';
import { Quiz } from '../types';
import { api } from '../lib/api';

interface ParticipantEntryProps {
  onStartQuiz: (attemptId: string) => void;
  onViewResult: (attemptId: string) => void;
}

export const ParticipantEntry: React.FC<ParticipantEntryProps> = ({
  onStartQuiz,
  onViewResult
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousAttemptId, setPreviousAttemptId] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.getAvailableQuizzes();
      setQuizzes(res.quizzes);
      if (res.quizzes.length > 0) {
        setSelectedQuizId(res.quizzes[0].id);
      }
    } catch (err: any) {
      setErrorMessage('Unable to load active competitions. Please refresh or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  const handleApplyAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPreviousAttemptId(null);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanPhone) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setErrorMessage('Please enter a valid phone number (at least 7 digits).');
      return;
    }

    if (!selectedQuizId) {
      setErrorMessage('Please select a quiz to participate in.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.startAttempt(selectedQuizId, cleanName, cleanPhone);
      if (res.success && res.attemptId) {
        // Save to sessionStorage for refresh resilience
        sessionStorage.setItem('current_quiz_attempt_id', res.attemptId);
        onStartQuiz(res.attemptId);
      }
    } catch (err: any) {
      if (err.code === 'ALREADY_ATTEMPTED') {
        setErrorMessage('You have already attempted this quiz. Multiple attempts are not allowed.');
        if (err.attemptId) {
          setPreviousAttemptId(err.attemptId);
        }
      } else {
        setErrorMessage(err.message || 'Failed to start quiz. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          Online Quiz Competition
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Test your knowledge against standardized assessments with randomized questions, strict timing controls, and instant evaluation.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4" />
          <p className="text-sm text-slate-600">Loading available competitions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quiz Details Panel */}
          {quizzes.length === 0 ? (
            <div className="order-2 lg:order-1 lg:col-span-5 bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-800 mb-1">No Active Competitions</h2>
              <p className="text-sm text-slate-500">
                There are currently no published quizzes. Your participant entry form is ready; you can start when a competition becomes available.
              </p>
            </div>
          ) : (
            <div className="order-2 lg:order-1 lg:col-span-5 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <label htmlFor="competition-selector" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Select Competition
              </label>
              <select
                id="competition-selector"
                value={selectedQuizId}
                onChange={(e) => {
                  setSelectedQuizId(e.target.value);
                  setErrorMessage(null);
                  setPreviousAttemptId(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>

              {selectedQuiz && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    {selectedQuiz.description || 'Standard timed evaluation with randomly assigned questions.'}
                  </p>

                  {/* Metadata Specs (Zero-Pill Discipline: Unboxed Text with Separators) */}
                  <div className="space-y-3 bg-slate-50 rounded-lg p-4 text-xs text-slate-600 border border-slate-150">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {selectedQuiz.duration_minutes} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Questions per Attempt</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {selectedQuiz.questions_per_attempt} randomly picked
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Marks</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {selectedQuiz.total_marks} pts
                      </span>
                    </div>
                    {selectedQuiz.negative_marking > 0 && (
                      <div className="flex items-center justify-between text-rose-600">
                        <span>Negative Marking</span>
                        <span className="font-semibold tabular-nums">
                          -{selectedQuiz.negative_marking} per wrong answer
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Competition Rules Reminder */}
                  <div className="mt-4 pt-3 text-xs text-slate-500 space-y-1">
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Strict 1 attempt per phone number.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Countdown timer starts immediately upon clicking Apply.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Answers save progressively and submit automatically when time expires.</span>
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Participant Entry Form */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                  Participant Registration
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Enter your details to initiate your timed session immediately.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{errorMessage}</p>
                    {previousAttemptId && (
                      <button
                        type="button"
                        onClick={() => onViewResult(previousAttemptId)}
                        className="mt-2 text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer block"
                      >
                        Click here to view your previous result →
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleApplyAndStart} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="e.g. JASEEL"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Your phone number serves as your unique competition identifier for this quiz.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submitting || !selectedQuizId}
                    className="w-full py-3 px-6 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying & Preparing Quiz...</span>
                      </>
                    ) : (
                      <>
                        <span>{selectedQuizId ? 'Apply & Start Quiz' : 'No Active Quiz Available'}</span>
                        {selectedQuizId && <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-2.5">
                    {selectedQuizId
                      ? 'No extra screens or loading steps. Timer begins immediately.'
                      : 'You can enter a competition after one is published.'}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
