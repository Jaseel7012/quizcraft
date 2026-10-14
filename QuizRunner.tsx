import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Circle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { ActiveAttempt, AttemptQuestion } from '../types';
import { api } from '../lib/api';

interface QuizRunnerProps {
  attemptId: string;
  onSubmitted: (attemptId: string) => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  attemptId,
  onSubmitted
}) => {
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [timedOutModal, setTimedOutModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitTriggeredRef = useRef<boolean>(false);

  // Load active attempt from server
  const loadAttempt = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAttempt(attemptId);
      setAttempt(data);

      // Hydrate answers from existing state
      const initialAnswers: Record<string, string | null> = {};
      data.questions.forEach((q) => {
        initialAnswers[q.id] = q.selected_option_id;
      });
      setAnswers(initialAnswers);

      // Initialize remaining time using authoritative server deadline
      const now = Date.now();
      const left = Math.max(0, Math.floor((data.deadlineAt - now) / 1000));
      setRemainingSeconds(left);

      if (data.status === 'submitted' || data.status === 'timed-out') {
        onSubmitted(attemptId);
      } else if (left <= 0) {
        handleTimeOut();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load quiz attempt.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, onSubmitted]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Handle Timeout
  const handleTimeOut = useCallback(async () => {
    if (autoSubmitTriggeredRef.current) return;
    autoSubmitTriggeredRef.current = true;

    setTimedOutModal(true);
    try {
      await api.submitAttempt(attemptId);
    } catch {
      // already submitted or handled
    }
  }, [attemptId]);

  // Live Timer Countdown
  useEffect(() => {
    if (!attempt || attempt.status !== 'in-progress') return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((attempt.deadlineAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimeOut();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, handleTimeOut]);

  // Progressive Answer Auto-save
  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!attempt || attempt.status !== 'in-progress' || remainingSeconds <= 0) return;

    // Toggle if clicking already selected
    const newOptionId = answers[questionId] === optionId ? null : optionId;

    // Update optimistic state
    setAnswers((prev) => ({ ...prev, [questionId]: newOptionId }));
    setSavingQuestionId(questionId);
    setSaveStatus('saving');

    try {
      await api.saveAnswer(attemptId, questionId, newOptionId);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleClearAnswer = async (questionId: string) => {
    if (!attempt || attempt.status !== 'in-progress') return;
    setAnswers((prev) => ({ ...prev, [questionId]: null }));
    setSavingQuestionId(questionId);
    setSaveStatus('saving');
    try {
      await api.saveAnswer(attemptId, questionId, null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1200);
    } catch {
      setSaveStatus('error');
    }
  };

  // Submit attempt
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      await api.submitAttempt(attemptId);
      sessionStorage.removeItem('current_quiz_attempt_id');
      onSubmitted(attemptId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-sm w-full shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Synchronizing Quiz Session</h2>
          <p className="text-xs text-slate-500 mt-1">Retrieving authoritative question set and timer...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-xl border border-rose-200 text-center max-w-md w-full shadow-xs">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Quiz Access Error</h2>
          <p className="text-sm text-slate-600 mb-6">{errorMessage || 'Unable to load quiz session.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = attempt.questions[currentIndex];
  const totalQuestions = attempt.questions.length;
  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;
  const remainingCount = totalQuestions - answeredCount;

  // Timer alert color styles
  const isTimeCritical = remainingSeconds <= 60;
  const isTimeWarning = remainingSeconds <= 180 && !isTimeCritical;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Quiz Top Bar: Fixed Header with Prominent Authoritative Timer */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 sm:py-0 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Quiz Title & Progress */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {attempt.quizTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] sm:text-xs text-slate-500">
              <span className="font-semibold text-slate-700 tabular-nums">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {answeredCount} Answered
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {remainingCount} Remaining
              </span>
            </div>
          </div>

          {/* Prominent Live Countdown Timer */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base tabular-nums transition-colors ${
                isTimeCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : isTimeWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            {/* Submit Quiz Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="sm:hidden">Submit</span>
              <span className="hidden sm:inline">Submit Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col lg:flex-row gap-6">
        {/* Left Column: Active Question Deck */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col">
            {/* Question Header & Metadata */}
            <div className="flex items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
              <div className="min-w-0 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">
                  Topic: {currentQuestion.topic}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{currentQuestion.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-indigo-700">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              {/* Progressive Save Status Indicator */}
              <div className="text-xs text-slate-400 font-mono shrink-0">
                {saveStatus === 'saving' && (
                  <span className="text-indigo-600 animate-pulse">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-rose-600">Failed to sync answer</span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 mb-8 flex-1">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-4 cursor-pointer text-sm sm:text-base ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {opt.option_key}
                    </div>
                    <div className="flex-1 pt-0.5 leading-snug">
                      {opt.option_text}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls: Previous, Clear, Next */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {answers[currentQuestion.id] && (
                <button
                  onClick={() => handleClearAnswer(currentQuestion.id)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Choice</span>
                </button>
              )}

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette */}
        <div className="lg:w-80 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Question Palette
            </h3>

            {/* Status Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-300" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Question Grid Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {attempt.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-semibold tabular-nums transition-all cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Total Questions</span>
                <span className="font-semibold tabular-nums">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered</span>
                <span className="font-semibold text-indigo-600 tabular-nums">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered</span>
                <span className="font-semibold text-slate-500 tabular-nums">{remainingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Confirm Quiz Submission
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              You have answered <strong className="text-slate-900 font-semibold">{answeredCount}</strong> out of{' '}
              <strong className="text-slate-900 font-semibold">{totalQuestions}</strong> questions.
              {remainingCount > 0 && (
                <span className="block mt-1 text-amber-700 font-medium">
                  {remainingCount} question{remainingCount > 1 ? 's are' : ' is'} currently unanswered.
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Once submitted, your answers will be evaluated authoritatively and cannot be modified.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>Yes, Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Modal */}
      {timedOutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Time Has Expired!
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Your allotted competition time has concluded. Your saved answers have been automatically recorded and evaluated.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem('current_quiz_attempt_id');
                onSubmitted(attemptId);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              View Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
