import React from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Flame,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { StudySession, StudyPlan, ExamConfig } from '../types';

interface TodayViewProps {
  plan: StudyPlan | null;
  examConfig: ExamConfig | null;
  onOpenSession: (session: StudySession) => void;
  onOpenExamConfig: () => void;
  onGoToPlan: () => void;
  onGoToBacklog: () => void;
  backlogCount: number;
}

export const TodayView: React.FC<TodayViewProps> = ({
  plan,
  examConfig,
  onOpenSession,
  onOpenExamConfig,
  onGoToPlan,
  onGoToBacklog,
  backlogCount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Find today's sessions in the plan
  const todayPlanDay = plan?.days.find(d => d.date === todayStr) || plan?.days[0] || null;
  const sessions = todayPlanDay?.sessions || [];

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const missedSessions = sessions.filter(s => s.status === 'missed');

  const totalMinutes = sessions.reduce((acc, cur) => acc + (cur.durationMinutes || 45), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const completionPercent = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

  // Next session up
  const nextSession = pendingSessions[0] || null;

  return (
    <div className="space-y-6">
      {/* Backlog Alert banner if any */}
      {backlogCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-950">
                You have {backlogCount} missed study {backlogCount === 1 ? 'session' : 'sessions'} in your backlog
              </p>
              <p className="text-[11px] text-rose-700">
                The adaptive engine can automatically redistribute them across your upcoming schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToBacklog}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Review & Reschedule
          </button>
        </div>
      )}

      {/* Today's Hero Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-200/60">
                Daily Focus
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Today's Study Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {sessions.length} sessions scheduled • {totalHours} hours study target
            </p>
          </div>

          {/* Daily Progress Ring/Bar */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="text-right">
              <p className="text-sm font-extrabold text-slate-900">{completionPercent}%</p>
              <p className="text-[10px] text-slate-400">
                {completedSessions.length}/{sessions.length} Completed
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 bg-emerald-500 transition-all duration-500"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${completionPercent}%, 0 ${completionPercent}%)` }}
              />
              <span className="relative z-10 text-[10px] font-bold text-slate-800 bg-white/90 rounded-full w-7 h-7 flex items-center justify-center">
                ✓
              </span>
            </div>
          </div>
        </div>

        {/* Next Session Callout Banner */}
        {nextSession && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                    Up Next at {nextSession.start_time}
                  </span>
                  {nextSession.is_hard && (
                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                      Hard Topic (1.5x Time)
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {nextSession.topic_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {nextSession.subject_name} • {nextSession.durationMinutes || 45} minutes • Timer, Flashcards & Quiz
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenSession(nextSession)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Session Now</span>
            </button>
          </div>
        )}
      </div>

      {/* All Today's Sessions Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Sessions for Today ({sessions.length})
          </h3>
          <button
            onClick={onGoToPlan}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View Full Adaptive Plan</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Sessions Scheduled For Today</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You may have already completed your target for today, or you can generate a new adaptive plan based on your exam date.
            </p>
            <button
              onClick={onOpenExamConfig}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              Adjust Exam & Plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, idx) => {
              const isCompleted = session.status === 'completed';
              const isMissed = session.status === 'missed';

              return (
                <div
                  key={session.id || idx}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : isMissed
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time pill */}
                    <div className="w-16 py-1.5 rounded-xl bg-slate-100 text-center shrink-0 border border-slate-200/70">
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        {session.start_time}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {session.durationMinutes || 45} min
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: session.subject_color }}
                        />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {session.subject_name}
                        </span>
                        {session.is_hard && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                            <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                            Hard Topic
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold capitalize">
                          {(session.session_type || session.sessionType || 'study').replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900">
                        {session.topic_name}
                      </h4>

                      {session.notes && (
                        <p className="text-xs text-slate-500 italic">
                          "{session.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : isMissed ? (
                      <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>In Backlog</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenSession(session)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Study Session</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
