import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { Question, QuestionOption } from '../../types';
import { api } from '../../lib/api';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states for Single Question Add/Edit
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formText, setFormText] = useState('');
  const [formMarks, setFormMarks] = useState(2);
  const [formExplanation, setFormExplanation] = useState('');
  const [formOptions, setFormOptions] = useState<
    { key: 'A' | 'B' | 'C' | 'D'; text: string; correct: boolean }[]
  >([
    { key: 'A', text: '', correct: true },
    { key: 'B', text: '', correct: false },
    { key: 'C', text: '', correct: false },
    { key: 'D', text: '', correct: false }
  ]);

  useEffect(() => {
    loadQuestions();
  }, [topicFilter, diffFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminQuestions({
        search: search.trim() || undefined,
        topic: topicFilter || undefined,
        difficulty: diffFilter || undefined
      });
      setQuestions(res.questions);
      setTopics(res.topics);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuestions();
  };

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormTopic(topics[0] || 'General');
    setFormDifficulty('medium');
    setFormText('');
    setFormMarks(2);
    setFormExplanation('');
    setFormOptions([
      { key: 'A', text: '', correct: true },
      { key: 'B', text: '', correct: false },
      { key: 'C', text: '', correct: false },
      { key: 'D', text: '', correct: false }
    ]);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormTopic(q.topic);
    setFormDifficulty(q.difficulty);
    setFormText(q.question_text);
    setFormMarks(q.marks);
    setFormExplanation(q.explanation || '');

    const opts: { key: 'A' | 'B' | 'C' | 'D'; text: string; correct: boolean }[] = [
      { key: 'A', text: '', correct: false },
      { key: 'B', text: '', correct: false },
      { key: 'C', text: '', correct: false },
      { key: 'D', text: '', correct: false }
    ];

    q.options.forEach((opt) => {
      const idx = ['A', 'B', 'C', 'D'].indexOf(opt.option_key);
      if (idx !== -1) {
        opts[idx] = {
          key: opt.option_key,
          text: opt.option_text,
          correct: opt.is_correct === 1
        };
      }
    });

    setFormOptions(opts);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleSetCorrectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    setFormOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        correct: opt.key === key
      }))
    );
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formTopic.trim() || !formText.trim()) {
      setErrorMessage('Topic and Question text are required.');
      return;
    }

    const emptyOpt = formOptions.find((o) => !o.text.trim());
    if (emptyOpt) {
      setErrorMessage(`Please provide text for Option ${emptyOpt.key}.`);
      return;
    }

    const payload = {
      topic: formTopic.trim(),
      difficulty: formDifficulty,
      question_text: formText.trim(),
      marks: formMarks,
      explanation: formExplanation.trim(),
      options: formOptions.map((o) => ({
        option_key: o.key,
        option_text: o.text.trim(),
        is_correct: o.correct ? 1 : 0
      }))
    };

    try {
      setSaving(true);
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, payload);
        setSuccessMessage('Question updated successfully.');
      } else {
        await api.createQuestion(payload);
        setSuccessMessage('Question added to bank.');
      }
      setModalOpen(false);
      loadQuestions();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      await api.deleteQuestion(qId);
      setSuccessMessage('Question removed.');
      loadQuestions();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete question.');
    }
  };

  // Bulk Import
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a .csv file.');
      return;
    }

    try {
      const content = await file.text();
      if (!content.trim()) {
        setErrorMessage('The selected CSV file is empty.');
        return;
      }
      setCsvContent(content);
      setCsvFileName(file.name);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not read the selected CSV file.');
    }
  };

  const handleBulkImport = async () => {
    if (!csvContent.trim()) {
      setErrorMessage('Please paste valid CSV data.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.bulkImportQuestions(csvContent);
      setSuccessMessage(res.errors.length > 0
        ? `Imported ${res.importedCount} questions; ${res.errors.length} rows were skipped.`
        : `Imported ${res.importedCount} questions successfully!`);
      if (res.errors.length > 0) {
        setErrorMessage(`Some CSV rows were skipped: ${res.errors.join(' ')}`);
      }
      setImportModalOpen(false);
      setCsvContent('');
      setCsvFileName('');
      loadQuestions();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Bulk import failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `question_text,topic,difficulty,marks,option_a,option_b,option_c,option_d,correct_option,explanation
"What does CPU stand for?","Computer Architecture","easy",1,"Central Processing Unit","Computer Personal Unit","Central Program Utility","Core Performance Unit","A","CPU stands for Central Processing Unit."
"Which protocol provides secure encrypted web traffic?","Networking","easy",1,"HTTP","HTTPS","FTP","Telnet","B","HTTPS uses TLS/SSL for encrypted browser transmission."
"What is the average time complexity of QuickSort?","Algorithms","medium",2,"O(n log n)","O(n^2)","O(n)","O(1)","A","QuickSort averages O(n log n) on random arrays."`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain categorized questions, 4-option answer keys, and import bulk assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={() => {
              setCsvContent('');
              setCsvFileName('');
              setErrorMessage(null);
              setImportModalOpen(true);
            }}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
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
            placeholder="Search by question text or topic..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </form>

        <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto min-w-0">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 sm:flex-1"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 sm:flex-1"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {(search || topicFilter || diffFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setTopicFilter('');
                setDiffFilter('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading question repository...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No questions found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting search filters or add a new question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const correctOpt = q.options.find((o) => o.is_correct === 1);
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.question_text}
                      </p>

                      {/* Zero-Pill Metadata */}
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-1.5">
                        <span className="font-medium text-slate-700">{q.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{q.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-semibold text-indigo-700">
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                      </div>

                      {/* Options Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-md text-xs flex items-center gap-2 ${
                              opt.is_correct === 1
                                ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}
                          >
                            <span className="w-4 h-4 rounded font-bold text-2xs flex items-center justify-center shrink-0">
                              {opt.option_key}
                            </span>
                            <span className="min-w-0 truncate">{opt.option_text}</span>
                            {opt.is_correct === 1 && (
                              <span className="ml-auto text-2xs text-emerald-700 font-bold shrink-0">
                                (Correct)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      title="Edit Question"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete Question"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingQuestion ? 'Edit Question' : 'Add New Question to Bank'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topic / Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Algorithms"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Enter full question description..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Four Answer Options (Select Radio for Correct Choice)
                  </label>
                  <span className="text-2xs text-slate-500">Radio button selects correct answer</span>
                </div>

                {formOptions.map((opt, idx) => (
                  <div
                    key={opt.key}
                    className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                      opt.correct
                        ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(opt.key)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer shrink-0 ${
                        opt.correct
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt.correct && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <span className="font-bold text-xs text-slate-600 w-4 shrink-0">
                      {opt.key}:
                    </span>

                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormOptions((prev) =>
                          prev.map((o) => (o.key === opt.key ? { ...o, text: val } : o))
                        );
                      }}
                      placeholder={`Option ${opt.key} text`}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-hidden"
                    />

                    {opt.correct && (
                      <span className="text-2xs font-bold text-emerald-700 shrink-0">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation / Reference (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct for participant review..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Import Questions from CSV</h3>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span>Need the required format structure?</span>
              <button
                onClick={handleDownloadTemplate}
                className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Upload a CSV file
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="block w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
              />
              {csvFileName && (
                <p className="text-xs text-emerald-700">
                  Loaded {csvFileName}. Valid rows will be imported; invalid rows will be reported.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>or paste CSV content</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste CSV Rows Below (Header required: question_text, topic, difficulty, marks, option_a, option_b, option_c, option_d, correct_option, explanation)
              </label>
              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`question_text,topic,difficulty,marks,option_a,option_b,option_c,option_d,correct_option,explanation\n"What is 2+2?","Math","easy",1,"3","4","5","6","B","Basic arithmetic"`}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={saving || !csvContent.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? 'Importing...' : 'Parse & Import Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
