import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Users,
  Timer,
  Award,
  TrendingUp,
  BarChart3,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { DashboardKPIs } from '../../types';
import { api } from '../../lib/api';

interface DashboardOverviewProps {
  onNavigateSection: (section: 'quizzes' | 'questions' | 'participants' | 'reports') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateSection }) => {
  const [data, setData] = useState<{
    kpis: DashboardKPIs;
    recentActivity: any[];
    scoreDistribution: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getReportsOverview();
      setData(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Loading competition metrics...</p>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        {errorMessage || 'Failed to load dashboard.'}
      </div>
    );
  }

  const { kpis, recentActivity, scoreDistribution } = data;

  // Compute maximum count in score distribution for proportional bar charts
  const maxScoreCount = Math.max(1, ...scoreDistribution.map((s) => s.count || 0));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Overview & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics across competitions, participant cohorts, and scoring accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSection('quizzes')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>Manage Quizzes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Quizzes</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {kpis.totalQuizzes}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-emerald-600 tabular-nums">{kpis.publishedQuizzes}</span> published
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Registered Participants</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {kpis.totalParticipants}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Unique phone registrations
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Attempts</span>
            <Timer className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {kpis.totalAttempts}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Strict 1 attempt per quiz
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Highest Score</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 tabular-nums">
            {kpis.maxScore} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Top competitive mark
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Average Score</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {kpis.avgScore} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-700 tabular-nums">{kpis.avgPercentage}%</span> mean accuracy
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Avg Completion Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {Math.floor(kpis.avgCompletionSeconds / 60)}m {kpis.avgCompletionSeconds % 60}s
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across finished attempts
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Completed Submissions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {kpis.passedCount + kpis.failedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Finished & evaluated attempts
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Mean Accuracy</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 tabular-nums">
            {kpis.avgPercentage}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Overall participant accuracy
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Score Distribution Curve
              </h2>
              <p className="text-xs text-slate-500">
                Cohort percentile breakdown across all completed attempts
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total: {kpis.totalAttempts} Attempts
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].map((bracket) => {
              const item = scoreDistribution.find((s) => s.bracket === bracket);
              const count = item ? item.count : 0;
              const percentage = Math.round((count / maxScoreCount) * 100);

              return (
                <div key={bracket} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span className="font-mono">{bracket}</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {count} {count === 1 ? 'participant' : 'participants'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        bracket === '81-100%'
                          ? 'bg-emerald-500'
                          : bracket === '61-80%'
                          ? 'bg-indigo-500'
                          : bracket === '41-60%'
                          ? 'bg-sky-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion & Evaluation Matrix */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Assessment Completion Rate
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Percentage of initiated sessions completed and submitted
            </p>

            <div className="flex items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG circular gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {kpis.totalAttempts > 0 && (
                    <path
                      className="text-indigo-600 transition-all duration-700"
                      strokeDasharray={`${Math.round(
                        ((kpis.passedCount + kpis.failedCount) / Math.max(1, kpis.totalAttempts)) * 100
                      )}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-extrabold text-slate-900 tabular-nums block">
                    {kpis.totalAttempts > 0
                      ? `${Math.round(((kpis.passedCount + kpis.failedCount) / kpis.totalAttempts) * 100)}%`
                      : '100%'}
                  </span>
                  <span className="text-2xs text-slate-500 font-medium">Completion</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                <span className="text-indigo-700 font-semibold block">Completed</span>
                <span className="text-base font-bold text-indigo-900 tabular-nums">
                  {kpis.passedCount + kpis.failedCount}
                </span>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-semibold block">Total Started</span>
                <span className="text-base font-bold text-slate-800 tabular-nums">
                  {kpis.totalAttempts}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateSection('participants')}
              className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              View Participant Records →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
