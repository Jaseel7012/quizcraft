import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Download,
  AlertCircle,
  X,
  Phone,
  User,
  Award
} from 'lucide-react';
import { ParticipantRecord, Quiz } from '../../types';
import { api } from '../../lib/api';

export const ParticipantManager: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<{ attempt: any; questions: any[] } | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [quizFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, qRes] = await Promise.all([
        api.getAdminParticipants({
          search: search.trim() || undefined,
          quizId: quizFilter || undefined,
          status: statusFilter || undefined
        }),
        api.getAdminQuizzes()
      ]);
      setParticipants(pRes.participants);
      setQuizzes(qRes.quizzes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleViewAttempt = async (attemptId: string) => {
    try {
      const data = await api.getAttemptDetails(attemptId);
      setSelectedAttempt(data);
      setViewModalOpen(true);
    } catch (err: any) {
      setErrorMessage('Failed to load attempt details.');
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!window.confirm('Are you sure you want to delete this attempt record? This will allow the phone number to attempt the quiz again.')) {
      return;
    }
    try {
      await api.deleteAttempt(attemptId);
      setSuccessMessage('Attempt record removed.');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete attempt');
    }
  };

  // Client-side quick CSV export of currently filtered participants
  const handleExportCSV = () => {
    if (participants.length === 0) return;
    let csv = 'Full Name,Phone Number,Quiz Title,Status,Start Time,Submission Time,Duration (Seconds),Score,Total Marks,Percentage\n';
    participants.forEach((p) => {
      const startTime = new Date(p.started_at).toLocaleString();
      const subTime = p.submitted_at ? new Date(p.submitted_at).toLocaleString() : 'N/A';
      csv += `"${p.full_name.replace(/"/g, '""')}","${p.normalized_phone}","${p.quiz_title.replace(/"/g, '""')}","${p.status}","${startTime}","${subTime}",${p.duration_seconds},${p.score},${p.total_possible_score},${p.percentage}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Participant Tracker & Attempts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enforced 1-attempt tracking per phone number, progressive evaluation, and attempt auditing.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={participants.length === 0}
          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs self-start"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Filtered to CSV</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by participant name or phone number..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={quizFilter}
            onChange={(e) => setQuizFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 flex-1 sm:flex-initial"
          >
            <option value="">All Quizzes</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 flex-1 sm:flex-initial"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="timed-out">Timed Out</option>
            <option value="in-progress">In Progress</option>
          </select>

          {(search || quizFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setQuizFilter('');
                setStatusFilter('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading participant attempts...</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No attempts found</p>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search or filter options.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Participant</th>
                  <th className="px-4 py-3.5">Competition</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Duration</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                  <th className="px-4 py-3.5 text-center">Evaluation</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => {
                  const mins = Math.floor(p.duration_seconds / 60);
                  const secs = p.duration_seconds % 60;

                  return (
                    <tr key={p.attempt_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {p.full_name}
                        </div>
                        <div className="text-slate-500 text-xs font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.normalized_phone}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 max-w-xs truncate text-slate-800 font-medium">
                        {p.quiz_title}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {p.status === 'submitted' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        ) : p.status === 'timed-out' ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Timed Out</span>
                          </span>
                        ) : (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums text-slate-700 whitespace-nowrap">
                        {p.status === 'in-progress' ? '—' : `${mins}m ${secs}s`}
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums font-bold text-slate-900">
                        {p.score} <span className="text-2xs font-normal text-slate-400">/ {p.total_possible_score}</span>
                      </td>

                      <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-700">
                        {p.percentage}%
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {p.status === 'in-progress' ? (
                          <span className="text-slate-400 text-2xs italic">In Progress</span>
                        ) : p.status === 'timed-out' ? (
                          <span className="text-amber-700 font-bold text-2xs uppercase tracking-wide">
                            TIMED OUT
                          </span>
                        ) : (
                          <span className="text-indigo-700 font-bold text-2xs uppercase tracking-wide">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewAttempt(p.attempt_id)}
                            title="Review Attempt Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttempt(p.attempt_id)}
                            title="Delete / Reset Attempt"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Attempt Modal */}
      {viewModalOpen && selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Attempt Audit Breakdown: {selectedAttempt.attempt.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: {selectedAttempt.attempt.normalized_phone} · Quiz: {selectedAttempt.attempt.quiz_title}
                </p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Score header strip */}
              <div className="grid grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Score</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">
                    {selectedAttempt.attempt.score} / {selectedAttempt.attempt.total_possible_score}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Percentage</span>
                  <span className="font-bold text-indigo-600 text-sm tabular-nums">
                    {selectedAttempt.attempt.percentage}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedAttempt.attempt.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Evaluation</span>
                  <span className="font-bold text-indigo-700 uppercase">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Individual Question Audit */}
              <div className="space-y-3 pt-2">
                {selectedAttempt.questions.map((q, idx) => {
                  const isCorrect = q.is_correct === 1;
                  const isUnanswered = !q.selected_option_id;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isUnanswered
                          ? 'border-slate-200 bg-slate-50/30'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-slate-900 text-xs leading-snug">
                          {idx + 1}. {q.question_text}
                        </p>
                        <span
                          className={`font-bold shrink-0 ${
                            isCorrect ? 'text-emerald-700' : isUnanswered ? 'text-slate-500' : 'text-rose-700'
                          }`}
                        >
                          {isCorrect ? `+${q.marks}` : isUnanswered ? '0 (Skipped)' : `${q.score_awarded ?? 0}`} pts
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {q.options.map((opt: any) => {
                          const isPicked = q.selected_option_id === opt.id;
                          const isAnswerKey = opt.is_correct === 1;

                          let badgeStyle = 'text-slate-600';
                          if (isAnswerKey) badgeStyle = 'text-emerald-800 font-bold';
                          if (isPicked && !isAnswerKey) badgeStyle = 'text-rose-700 font-medium line-through';

                          return (
                            <div key={opt.id} className={`flex items-center gap-2 ${badgeStyle}`}>
                              <span className="w-4 font-bold">{opt.option_key}.</span>
                              <span>{opt.option_text}</span>
                              {isAnswerKey && (
                                <span className="text-2xs text-emerald-700 font-semibold">(Correct Answer)</span>
                              )}
                              {isPicked && (
                                <span className="text-2xs text-indigo-700 font-semibold">(Participant Selected)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
