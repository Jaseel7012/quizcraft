/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ParticipantEntry } from './components/ParticipantEntry';
import { QuizRunner } from './components/QuizRunner';
import { QuizResult } from './components/QuizResult';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { getAdminToken, clearAdminAuth, api } from './lib/api';

type AppView = 'home' | 'quiz' | 'result' | 'admin-login' | 'admin';

const isAdminPath = () => window.location.pathname.replace(/\/+$/, '') === '/admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() =>
    isAdminPath() ? 'admin-login' : 'home'
  );
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if admin session exists
    const token = getAdminToken();
    if (token) {
      api.adminMe()
        .then(() => {
          setIsAdminLoggedIn(true);
          if (isAdminPath()) setCurrentView('admin');
        })
        .catch(() => {
          clearAdminAuth();
          setIsAdminLoggedIn(false);
        });
    }

    // 2. Check if participant reloaded with active attempt
    const savedAttemptId = sessionStorage.getItem('current_quiz_attempt_id');
    if (savedAttemptId && !isAdminPath()) {
      setActiveAttemptId(savedAttemptId);
      setCurrentView('quiz');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(isAdminPath()
        ? isAdminLoggedIn ? 'admin' : 'admin-login'
        : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminLoggedIn]);

  const navigateTo = (view: AppView) => {
    const path = view === 'admin' || view === 'admin-login' ? '/admin' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentView(view);
  };

  const handleStartQuiz = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setCurrentView('quiz');
  };

  const handleViewResult = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setCurrentView('result');
  };

  const handleQuizSubmitted = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setCurrentView('result');
  };

  const handleAdminLogout = () => {
    clearAdminAuth();
    setIsAdminLoggedIn(false);
    navigateTo('home');
  };

  const handleNavigate = (view: 'home' | 'admin-login' | 'admin') => {
    if (view === 'admin' && !isAdminLoggedIn) {
      navigateTo('admin-login');
      return;
    }
    navigateTo(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <ParticipantEntry
            onStartQuiz={handleStartQuiz}
            onViewResult={handleViewResult}
          />
        )}

        {currentView === 'quiz' && activeAttemptId && (
          <QuizRunner
            attemptId={activeAttemptId}
            onSubmitted={handleQuizSubmitted}
          />
        )}

        {currentView === 'result' && activeAttemptId && (
          <QuizResult
            onGoHome={() => {
              setActiveAttemptId(null);
              sessionStorage.removeItem('current_quiz_attempt_id');
              navigateTo('home');
            }}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onSuccess={() => {
              setIsAdminLoggedIn(true);
              setCurrentView('admin');
            }}
            onBackToHome={() => navigateTo('home')}
          />
        )}

        {currentView === 'admin' && (
          isAdminLoggedIn ? (
            <AdminLayout
              onLogout={handleAdminLogout}
              onGoHome={() => navigateTo('home')}
            />
          ) : (
            <AdminLogin
              onSuccess={() => {
                setIsAdminLoggedIn(true);
                setCurrentView('admin');
              }}
              onBackToHome={() => navigateTo('home')}
            />
          )
        )}
      </main>
    </div>
  );
}
