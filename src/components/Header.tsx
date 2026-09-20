import React from 'react';
import {
  Sparkles,
  Flame,
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  User as UserIcon,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { User, ExamConfig } from '../types';

interface HeaderProps {
  activeTab: 'today' | 'plan' | 'subjects' | 'backlog' | 'progress';
  setActiveTab: (tab: 'today' | 'plan' | 'subjects' | 'backlog' | 'progress') => void;
  user: User | null;
  examConfig: ExamConfig | null;
  backlogCount: number;
  streakDays: number;
  onOpenAuth: () => void;
  onOpenExamConfig: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  examConfig,
  backlogCount,
  streakDays,
  onOpenAuth,
  onOpenExamConfig,
  onLogout,
}) => {
  // Calculate days remaining until exam
  let daysRemaining: number | null = null;
  if (examConfig?.examDate) {
    const examDate = new Date(examConfig.examDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">StudySync AI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                  Adaptive
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Exam preparation companion</p>
            </div>
          </div>

          {/* Exam Status & Streak Header Center Pill */}
          <div className="hidden md:flex items-center gap-2.5">
            {examConfig && (
              <button
                onClick={onOpenExamConfig}
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 rounded-xl text-xs font-medium text-slate-700 transition-colors border border-slate-200/60 cursor-pointer"
                title="Click to edit exam date & daily study hours"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate max-w-[140px] font-semibold text-slate-900">{examConfig.examTitle}</span>
                {daysRemaining !== null && (
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px]">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                  </span>
                )}
                <span className="text-slate-400 group-hover:text-slate-600 text-[10px]">✎</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/70 rounded-xl text-xs font-semibold text-amber-800">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{streakDays} Day Streak</span>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Quick Reschedule CTA if backlog exists */}
            {backlogCount > 0 && (
              <button
                onClick={() => setActiveTab('backlog')}
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Backlog</span>
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-extrabold">
                  {backlogCount}
                </span>
              </button>
            )}

            {/* Exam Config Button */}
            <button
              onClick={onOpenExamConfig}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Set Exam & Hours</span>
              <span className="sm:hidden">Plan</span>
            </button>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-100">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Today's Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Adaptive Study Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Subjects & Notes Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('backlog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
              activeTab === 'backlog'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Backlog & Reschedule</span>
            {backlogCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'backlog' ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
              }`}>
                {backlogCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progress & History</span>
          </button>
        </div>
      </div>
    </header>
  );
};
