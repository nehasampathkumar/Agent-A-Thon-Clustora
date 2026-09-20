import React from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { ProgressMetrics } from '../types';

interface ProgressDashboardProps {
  metrics: ProgressMetrics | null;
  onRefresh: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading progress metrics...</p>
      </div>
    );
  }

  const totalMin = metrics.totalMinutesStudied ?? metrics.totalStudyMinutes ?? 0;
  const hoursStudied = Math.round((totalMin / 60) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.completionRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {metrics.completedSessions}/{metrics.totalSessions} sessions
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, metrics.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Daily Streak */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.streakDays}
            </span>
            <span className="text-xs text-amber-700 font-bold">Consecutive Days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Keep studying today to maintain your momentum!
          </p>
        </div>

        {/* Total Hours Studied */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Hours Mastered</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {hoursStudied}h
            </span>
            <span className="text-xs text-slate-400 font-medium">Recorded time</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Active timer & quiz completion time
          </p>
        </div>

        {/* Sessions Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Session Breakdown</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {metrics.completedSessions} Done
            </span>
            <span className="text-slate-600 font-semibold">
              {metrics.pendingSessions} Next
            </span>
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {metrics.missedSessions} Missed
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-0.5">
            <div
              className="bg-emerald-500"
              style={{ width: `${(metrics.completedSessions / Math.max(1, metrics.totalSessions)) * 100}%` }}
            />
            <div
              className="bg-slate-300"
              style={{ width: `${(metrics.pendingSessions / Math.max(1, metrics.totalSessions)) * 100}%` }}
            />
            <div
              className="bg-rose-400"
              style={{ width: `${(metrics.missedSessions / Math.max(1, metrics.totalSessions)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject Mastery Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span>Subject Time & Mastery Allocation</span>
        </h3>

        <div className="space-y-4 pt-1">
          {metrics.subjectStats.map(subj => (
            <div key={subj.subjectId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: subj.color }}
                  />
                  <span className="font-bold text-slate-800">{subj.subjectName}</span>
                </div>
                <div className="flex items-center gap-3 font-semibold text-slate-500">
                  <span>{subj.completedHours}h completed of {subj.totalHours}h</span>
                  <span className="text-slate-900 font-bold">{subj.percent}%</span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    backgroundColor: subj.color || '#6366F1',
                    width: `${Math.min(100, subj.percent)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity History Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <span>Recent Activity & Study History</span>
        </h3>

        {metrics.recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400">No activity recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-4 my-2 ml-2">
            {metrics.recentActivity.map(act => {
              const isCompleted = act.type === 'completed';
              const isMissed = act.type === 'missed';
              const isRescheduled = act.type === 'rescheduled';
              const d = new Date(act.timestamp);
              const timeStr = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={act.id} className="relative">
                  <div
                    className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isMissed
                        ? 'bg-rose-500'
                        : isRescheduled
                        ? 'bg-indigo-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-500">{act.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {timeStr}
                    </span>
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
