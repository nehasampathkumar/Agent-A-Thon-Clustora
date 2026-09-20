/**
 * StudySync AI - Adaptive Study Companion
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Subject,
  UploadedNoteFile,
  Topic,
  ExamConfig,
  StudyPlan,
  StudySession,
  ProgressMetrics,
} from './types';
import { api, authState } from './lib/api';

// Components
import { Header } from './components/Header';
import { TodayView } from './components/TodayView';
import { PlanView } from './components/PlanView';
import { SubjectManager } from './components/SubjectManager';
import { NotesUploader } from './components/NotesUploader';
import { BacklogManager } from './components/BacklogManager';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SessionPlayerModal } from './components/SessionPlayerModal';
import { ExamConfigModal } from './components/ExamConfigModal';
import { AuthModal } from './components/AuthModal';
import { FloatingChatbot } from './components/FloatingChatbot';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'subjects' | 'backlog' | 'progress'>('today');

  // Core Data State
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<UploadedNoteFile[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [backlogSessions, setBacklogSessions] = useState<StudySession[]>([]);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);

  // Loading and Error States
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExamConfigModalOpen, setIsExamConfigModalOpen] = useState(false);
  const [activeSessionForModal, setActiveSessionForModal] = useState<StudySession | null>(null);
  const [uploadTargetSubjectId, setUploadTargetSubjectId] = useState<string | undefined>(undefined);

  // Load all user data
  const loadAppData = useCallback(async () => {
    try {
      // Check auth or auto-login with demo student if no token
      let currentUser = authState.getCachedUser();
      const token = authState.getToken();

      if (!token) {
        try {
          const demoRes = await api.login('demo@studysync.ai', 'password123');
          currentUser = demoRes.user;
          setUser(currentUser);
        } catch {
          // continue
        }
      } else {
        try {
          const meRes = await api.getMe();
          currentUser = meRes.user;
          setUser(currentUser);
        } catch {
          // Token expired, log in demo
          try {
            const demoRes = await api.login('demo@studysync.ai', 'password123');
            currentUser = demoRes.user;
            setUser(currentUser);
          } catch {
            authState.removeToken();
          }
        }
      }

      // Fetch all primary resources in parallel
      const [
        fetchedSubjects,
        fetchedFiles,
        fetchedTopics,
        fetchedExam,
        fetchedPlan,
        fetchedBacklog,
        fetchedProgress,
      ] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getFiles().catch(() => []),
        api.getTopics().catch(() => []),
        api.getExamConfig().catch(() => null),
        api.getPlan().catch(() => null),
        api.getBacklog().catch(() => []),
        api.getProgress().catch(() => null),
      ]);

      setSubjects(fetchedSubjects);
      setFiles(fetchedFiles);
      setTopics(fetchedTopics);
      setExamConfig(fetchedExam);
      setPlan(fetchedPlan);
      setBacklogSessions(fetchedBacklog);
      setProgressMetrics(fetchedProgress);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const handleLogout = () => {
    authState.removeToken();
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    loadAppData();
  };

  const handleExamConfigSaved = (newConfig: ExamConfig, planGenerated?: boolean) => {
    setExamConfig(newConfig);
    loadAppData();
    if (planGenerated) {
      setActiveTab('plan');
    }
  };

  const handleOpenUploadForSubject = (subjectId: string) => {
    setUploadTargetSubjectId(subjectId);
    setActiveTab('subjects');
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700 tracking-tight">
            Initializing StudySync AI...
          </p>
          <p className="text-xs text-slate-400">Loading adaptive curriculum and study plan</p>
        </div>
      </div>
    );
  }

  const streakDays = progressMetrics?.streakDays || 1;
  const backlogCount = backlogSessions.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        examConfig={examConfig}
        backlogCount={backlogCount}
        streakDays={streakDays}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenExamConfig={() => setIsExamConfigModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: TODAY'S STUDY SESSIONS */}
        {activeTab === 'today' && (
          <TodayView
            plan={plan}
            examConfig={examConfig}
            onOpenSession={session => setActiveSessionForModal(session)}
            onOpenExamConfig={() => setIsExamConfigModalOpen(true)}
            onGoToPlan={() => setActiveTab('plan')}
            onGoToBacklog={() => setActiveTab('backlog')}
            backlogCount={backlogCount}
          />
        )}

        {/* VIEW 2: ADAPTIVE STUDY PLAN */}
        {activeTab === 'plan' && (
          <PlanView
            plan={plan}
            onPlanApproved={loadAppData}
            onOpenSession={session => setActiveSessionForModal(session)}
            onOpenExamConfig={() => setIsExamConfigModalOpen(true)}
          />
        )}

        {/* VIEW 3: SUBJECTS & NOTES UPLOAD */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <NotesUploader
              subjects={subjects}
              defaultSubjectId={uploadTargetSubjectId}
              onUploadSuccess={loadAppData}
            />

            <SubjectManager
              subjects={subjects}
              topics={topics}
              files={files}
              onRefresh={loadAppData}
              onOpenUploadForSubject={handleOpenUploadForSubject}
            />
          </div>
        )}

        {/* VIEW 4: BACKLOG & RESCHEDULE */}
        {activeTab === 'backlog' && (
          <BacklogManager
            backlogSessions={backlogSessions}
            onRefresh={loadAppData}
            onOpenSession={session => setActiveSessionForModal(session)}
          />
        )}

        {/* VIEW 5: PROGRESS & HISTORY */}
        {activeTab === 'progress' && (
          <ProgressDashboard
            metrics={progressMetrics}
            onRefresh={loadAppData}
          />
        )}
      </main>

      {/* MODALS */}

      {/* Active Study Session Player (Timer, Flashcards, Quiz) */}
      <SessionPlayerModal
        session={activeSessionForModal}
        isOpen={!!activeSessionForModal}
        onClose={() => setActiveSessionForModal(null)}
        onSessionUpdated={loadAppData}
      />

      {/* Exam Configuration & Hours Modal */}
      <ExamConfigModal
        isOpen={isExamConfigModalOpen}
        onClose={() => setIsExamConfigModalOpen(false)}
        config={examConfig}
        onConfigSaved={handleExamConfigSaved}
      />

      {/* User Login & Signup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Grounded Floating Chatbot Tutor */}
      <FloatingChatbot examTitle={examConfig?.examTitle} />
    </div>
  );
}
