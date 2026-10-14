import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { Quiz } from '../../types';
import { api, getAdminToken } from '../../lib/api';

export const QuizReports: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminQuizzes();
      setQuizzes(res.quizzes);
      if (res.quizzes.length > 0) {
        setSelectedQuizId(res.quizzes[0].id);
        loadQuizReport(res.quizzes[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizReport = async (quizId: string) => {
    try {
      setReportLoading(true);
      const data = await api.getQuizReport(quizId);
      setReportData(data);
    } catch (err: any) {
      setErrorMessage('Failed to fetch detailed quiz report.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleQuizChange = (newQuizId: string) => {
    setSelectedQuizId(newQuizId);
    loadQuizReport(newQuizId);
  };

  const handleDownloadCSV = () => {
    if (!selectedQuizId) return;
    const token = getAdminToken();
    window.open(`/api/admin/reports/export/${selectedQuizId}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
        <p className="text-xs text-slate-500">Loading competition reports...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-2xs">
        <p className="text-sm font-semibold text-slate-700">No Quizzes Created Yet</p>
        <p className="text-xs text-slate-400 mt-1">Create a quiz first to view reports and analytics.</p>
      </div>
    );
  }

  const { quiz, stats, questionStats, participants } = reportData || {};

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quiz Reports & Psychometric Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Question-level accuracy metrics, cohort percentile performance, and audit exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Export</span>
          </button>
        </div>
      </div>

      {/* Quiz Selector Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 print:hidden">
        <label htmlFor="quiz-report-selector" className="text-xs font-bold text-slate-700 uppercase tracking-wider sm:whitespace-nowrap">
          Select Competition:
        </label>
        <select
          id="quiz-report-selector"
          value={selectedQuizId}
          onChange={(e) => handleQuizChange(e.target.value)}
          className="w-full sm:flex-1 min-w-0 max-w-md px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 cursor-pointer"
        >
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} {q.is_published === 1 ? '(Published)' : '(Draft)'}
            </option>
          ))}
        </select>
      </div>

      {reportLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Generating analytics for {quiz?.title || 'quiz'}...</p>
        </div>
      ) : reportData && (
        <div className="space-y-8">
          {/* Printable Report Title Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Competition Performance Report
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {quiz.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Duration: {quiz.duration_minutes}m</span>
                  <span>·</span>
                  <span>Total Marks: {quiz.total_marks}</span>
                  <span>·</span>
                  <span>Random Questions / Attempt: {quiz.questions_per_attempt}</span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block font-mono">
                  Report Date: {new Date().toLocaleDateString()}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  Total Attempts: <strong className="text-indigo-600 tabular-nums">{stats.total_attempts}</strong>
                </span>
              </div>
            </div>

            {/* Core KPI metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Completed</div>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  {stats.submitted_count || 0}
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">Normal submits</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Timed Out</div>
                <div className="text-xl font-black text-amber-700 mt-1 tabular-nums">
                  {stats.timed_out_count || 0}
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">Auto submitted</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Average Score</div>
                <div className="text-xl font-black text-indigo-600 mt-1 tabular-nums">
                  {stats.avg_score || 0} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">{stats.avg_percentage}% mean</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Highest / Lowest</div>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  {stats.max_score || 0} <span className="text-xs font-normal text-slate-400">/ {stats.min_score || 0}</span>
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">Score range</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Evaluated Cohort</div>
                <div className="text-xl font-black text-indigo-600 mt-1 tabular-nums">
                  {participants ? participants.length : 0}
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">Total attempts</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div className="text-2xs text-slate-500 font-medium uppercase">Avg Duration</div>
                <div className="text-xl font-black text-slate-800 mt-1 tabular-nums">
                  {Math.floor((stats.avg_duration_seconds || 0) / 60)}m {(stats.avg_duration_seconds || 0) % 60}s
                </div>
                <div className="text-2xs text-slate-400 mt-0.5 font-mono">Per participant</div>
              </div>
            </div>
          </div>

          {/* Question-wise Psychometric Performance & Accuracy */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Question-Wise Accuracy & Psychometric Difficulty Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Statistical analysis based on random appearances across all participant attempts.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {questionStats.length} Questions in Bank
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Question Description</th>
                    <th className="px-3 py-3">Topic</th>
                    <th className="px-3 py-3 text-right">Appearances</th>
                    <th className="px-3 py-3 text-right">Correct</th>
                    <th className="px-3 py-3 text-right">Incorrect</th>
                    <th className="px-3 py-3 text-right">Accuracy Rate</th>
                    <th className="px-5 py-3 text-right">Empirical Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questionStats.map((qs: any, idx: number) => {
                    return (
                      <tr key={qs.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 max-w-md">
                          <span className="font-semibold text-slate-900 block leading-snug">
                            {idx + 1}. {qs.question_text}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                          {qs.topic}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-slate-800">
                          {qs.total_appearances}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-emerald-600">
                          {qs.correct_count || 0}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-rose-600">
                          {qs.incorrect_count || 0}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-slate-900">
                              {qs.accuracy_percentage}%
                            </span>
                            <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${qs.accuracy_percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span
                            className={`font-semibold text-xs ${
                              qs.accuracy_percentage < 40 && qs.total_appearances > 0
                                ? 'text-rose-700'
                                : qs.accuracy_percentage > 80 && qs.total_appearances > 0
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {qs.empirical_difficulty}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Participant Cohort Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Participant Results & Ranking
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative scores for all participants who attempted this quiz.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Rank & Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Percentage</th>
                    <th className="px-5 py-3 text-right">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants && participants.length > 0 ? (
                    participants.map((p: any, idx: number) => (
                      <tr key={p.attempt_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                          <span className="text-slate-400 font-normal mr-2">#{idx + 1}</span>
                          {p.full_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                          {p.normalized_phone}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap capitalize text-slate-700 font-medium">
                          {p.status}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums font-bold text-slate-900">
                          {p.score} <span className="text-slate-400 font-normal">/ {p.total_possible_score}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-indigo-700">
                          {p.percentage}%
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap font-bold text-2xs uppercase">
                          {p.status === 'timed-out' ? (
                            <span className="text-amber-700">TIMED OUT</span>
                          ) : (
                            <span className="text-indigo-700">COMPLETED</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No participants have attempted this quiz yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
