import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Users,
  BarChart3,
  Shield,
  KeyRound,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { QuizManager } from './QuizManager';
import { QuestionBank } from './QuestionBank';
import { ParticipantManager } from './ParticipantManager';
import { QuizReports } from './QuizReports';
import { ChangePasswordModal } from './ChangePasswordModal';
import { getAdminUsername } from '../../lib/api';

interface AdminLayoutProps {
  onLogout: () => void;
  onGoHome: () => void;
}

type AdminSection = 'overview' | 'quizzes' | 'questions' | 'participants' | 'reports';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, onGoHome }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const adminName = getAdminUsername() || 'Administrator';

  const navItems: { id: AdminSection; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'quizzes', label: 'Quiz Management', icon: BookOpen },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'participants', label: 'Participant Tracker', icon: Users },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  const handleSelectNav = (id: AdminSection) => {
    setActiveSection(id);
    setMobileSidebarOpen(false);
  };

  const getBreadcrumbTitle = () => {
    switch (activeSection) {
      case 'overview':
        return 'System Overview';
      case 'quizzes':
        return 'Quiz Management';
      case 'questions':
        return 'Question Bank';
      case 'participants':
        return 'Participant Tracker';
      case 'reports':
        return 'Reports & Analytics';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-slate-900 text-sm">QuizCraft Admin</span>
        </div>
        <button
          onClick={onGoHome}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Exit to App
        </button>
      </div>

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                  QuizCraft
                </span>
                <span className="text-2xs text-slate-400 font-mono">
                  Admin Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Admin profile & actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                {adminName}
              </span>
              <span className="text-2xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Session
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              title="Change Password"
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>

            <button
              onClick={onLogout}
              title="Logout Session"
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-400 rounded-md text-2xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <button
            onClick={onGoHome}
            className="w-full py-2 px-3 text-2xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Go to Participant Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Workspace Breadcrumb Header */}
        <div className="bg-white border-b border-slate-200 h-16 px-6 hidden md:flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{getBreadcrumbTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Participant Portal</span>
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <DashboardOverview onNavigateSection={(s) => setActiveSection(s)} />
          )}
          {activeSection === 'quizzes' && <QuizManager />}
          {activeSection === 'questions' && <QuestionBank />}
          {activeSection === 'participants' && <ParticipantManager />}
          {activeSection === 'reports' && <QuizReports />}
        </div>
      </main>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
