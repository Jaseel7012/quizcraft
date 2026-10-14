import React from 'react';
import { Award, Shield, LogOut } from 'lucide-react';
import { getAdminUsername } from '../lib/api';

interface HeaderProps {
  currentView: 'home' | 'quiz' | 'result' | 'admin-login' | 'admin';
  onNavigate: (view: 'home' | 'admin-login' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  onAdminLogout
}) => {
  // During an active quiz, keep header ultra-clean or minimized so participants are not distracted
  if (currentView === 'quiz') {
    return null;
  }

  const adminName = getAdminUsername();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                QuizCraft
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
                Online Competition Platform
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 cursor-pointer ${
              currentView === 'home' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Competitions
          </button>
          {isAdminLoggedIn && (
            <button
              onClick={() => onNavigate('admin')}
              className={`whitespace-nowrap transition-colors hover:text-slate-900 cursor-pointer ${
                currentView === 'admin' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {isAdminLoggedIn && (
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                onClick={() => onNavigate('admin')}
                className="px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>{adminName || 'Admin'}</span>
              </button>
              <button
                onClick={onAdminLogout}
                title="Logout from admin session"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          {!isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => onNavigate('admin-login')}
              className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Administrator
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
