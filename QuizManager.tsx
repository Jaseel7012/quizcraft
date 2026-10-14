import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Layers,
  X,
  Check,
  Search
} from 'lucide-react';
import { Quiz, Question } from '../../types';
import { api } from '../../lib/api';

export const QuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [totalMarks, setTotalMarks] = useState(20);
  const [passMark, setPassMark] = useState(10);
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizRes, qRes] = await Promise.all([
        api.getAdminQuizzes(),
        api.getAdminQuestions()
      ]);
      setQuizzes(quizRes.quizzes);
      setAllQuestions(qRes.questions);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load quiz list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingQuiz(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(15);
    setTotalMarks(20);
    setPassMark(10);
    setQuestionsPerAttempt(10);
    setNegativeMarking(0);
    setIsPublished(false);
    // By default select all existing questions for ease
    setSelectedQuestionIds(allQuestions.map((q) => q.id));
    setQuestionSearch('');
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setDurationMinutes(quiz.duration_minutes);
    setTotalMarks(quiz.total_marks);
    setPassMark(quiz.pass_mark);
    setQuestionsPerAttempt(quiz.questions_per_attempt);
    setNegativeMarking(quiz.negative_marking);
    setIsPublished(quiz.is_published === 1);
    setErrorMessage(null);
    setQuestionSearch('');

    try {
      const details = await api.getAdminQuiz(quiz.id);
      setSelectedQuestionIds(details.bankQuestions.map((q) => q.id));
      setModalOpen(true);
    } catch (err: any) {
      setErrorMessage('Failed to load quiz question bank details.');
    }
  };

  const handleToggleQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectAllQuestions = () => {
    setSelectedQuestionIds(allQuestions.map((q) => q.id));
  };

  const handleDeselectAllQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Quiz title is required.');
      return;
    }

    // Critical Validation: If published, question bank must have >= questions_per_attempt
    if (isPublished && selectedQuestionIds.length < questionsPerAttempt) {
      setErrorMessage(
        `Cannot publish quiz: Question bank contains ${selectedQuestionIds.length} question(s), but ${questionsPerAttempt} are required per attempt. Please select at least ${questionsPerAttempt} questions or save as draft.`
      );
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      pass_mark: passMark,
      questions_per_attempt: questionsPerAttempt,
      negative_marking: negativeMarking,
      is_published: isPublished ? 1 : 0,
      shuffle_options: 1,
      question_ids: selectedQuestionIds
    };

    try {
      setSaving(true);
      if (editingQuiz) {
        await api.updateQuiz(editingQuiz.id, payload);
        setSuccessMessage('Quiz updated successfully.');
      } else {
        await api.createQuiz(payload);
        setSuccessMessage('Quiz created successfully.');
      }
      setModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    try {
      await api.duplicateQuiz(quizId);
      setSuccessMessage('Quiz duplicated as draft.');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to duplicate quiz.');
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All participant attempts for this quiz will also be removed.')) {
      return;
    }
    try {
      await api.deleteQuiz(quizId);
      setSuccessMessage('Quiz deleted.');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete quiz.');
    }
  };

  const filteredQuestions = allQuestions.filter(
    (q) =>
      q.question_text.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.topic.toLowerCase().includes(questionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quiz Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure assessments, randomize question bank pools, and set grading rules.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quizzes Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading quizzes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Quiz Details</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Duration</th>
                  <th className="px-4 py-3.5 text-right">Bank / Attempt</th>
                  <th className="px-4 py-3.5 text-right">Total Marks</th>
                  <th className="px-4 py-3.5 text-right">Attempts</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {quiz.title}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-md">
                        {quiz.description || 'No description provided.'}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {quiz.is_published === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Draft</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-medium text-slate-700">
                      {quiz.duration_minutes} mins
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      <span className="font-bold text-slate-900">
                        {quiz.question_bank_count || 0}
                      </span>
                      <span className="text-slate-400 mx-1">in bank ·</span>
                      <span className="text-indigo-600 font-semibold">
                        {quiz.questions_per_attempt} / attempt
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">
                      {quiz.total_marks} pts
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">
                      {quiz.total_attempts || 0}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(quiz)}
                          title="Edit Quiz"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(quiz.id)}
                          title="Duplicate Quiz"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          title="Delete Quiz"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Quiz Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingQuiz ? 'Edit Quiz Settings' : 'Create New Competition Quiz'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveQuiz} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quiz Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Science Olympiad 2026"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief overview shown to participants before beginning..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Numeric Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Questions per Attempt
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={questionsPerAttempt}
                    onChange={(e) => setQuestionsPerAttempt(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-700 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Passing Threshold (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={passMark}
                    onChange={(e) => setPassMark(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Negative Marking
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-700 tabular-nums"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Publish Quiz (Make available for participant entry)
                    </span>
                    <span className="text-2xs text-slate-500">
                      Requires at least {questionsPerAttempt} questions selected in the pool below.
                    </span>
                  </div>
                </label>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">
                    Participant Results
                  </span>
                  <span className="text-2xs text-slate-500">
                    Scores and answer details are hidden from participants after submission and remain available in admin reports.
                  </span>
                </div>
              </div>

              {/* Question Bank Selection */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Question Pool Association ({selectedQuestionIds.length} Selected)
                    </h3>
                    <p className="text-2xs text-slate-500">
                      Each participant randomly gets {questionsPerAttempt} questions from this pool.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllQuestions}
                      className="text-2xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Select All ({allQuestions.length})
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllQuestions}
                      className="text-2xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Question Search Filter */}
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search question pool..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Scrollable Questions Checkbox List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {filteredQuestions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleQuestion(q.id)}
                        className={`p-2.5 rounded-md border text-xs flex items-start gap-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-indigo-600 shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="leading-snug">{q.question_text}</p>
                          <div className="flex items-center gap-2 text-2xs text-slate-400 mt-1">
                            <span>{q.topic}</span>
                            <span>·</span>
                            <span className="capitalize">{q.difficulty}</span>
                            <span>·</span>
                            <span>{q.marks} Mark</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingQuiz ? 'Save Changes' : 'Create Quiz'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
