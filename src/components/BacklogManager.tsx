import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { StudySession } from '../types';
import { api } from '../lib/api';

interface BacklogManagerProps {
  backlogSessions: StudySession[];
  onRefresh: () => void;
  onOpenSession: (session: StudySession) => void;
}

export const BacklogManager: React.FC<BacklogManagerProps> = ({
  backlogSessions,
  onRefresh,
  onOpenSession,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRescheduleAll = async () => {
    setIsRescheduling(true);
    setSuccessMsg(null);
    try {
      const res = await api.reschedulePlan([]);
      setSuccessMsg(res.message);
      onRefresh();
    } catch (err) {
      console.error('Failed to reschedule backlog:', err);
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleRescheduleSingle = async (sessionId: string) => {
    setIsRescheduling(true);
    setSuccessMsg(null);
    try {
      const res = await api.reschedulePlan([sessionId]);
      setSuccessMsg(res.message);
      onRefresh();
    } catch (err) {
      console.error('Failed to reschedule session:', err);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Missed Sessions & Backlog ({backlogSessions.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            When unexpected conflicts occur, missed sessions are routed here. The intelligent rescheduler smoothly distributes them into future available slots without overloading your daily hours.
          </p>
        </div>

        {backlogSessions.length > 0 && (
          <button
            onClick={handleRescheduleAll}
            disabled={isRescheduling}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isRescheduling ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Reschedule All Automatically</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Backlog List */}
      {backlogSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your Backlog is Clean!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You have no uncompleted or missed study sessions. You are completely on track with your adaptive exam plan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {backlogSessions.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: session.subject_color }}
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {session.subject_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Missed on {session.date}
                  </span>
                  {session.is_hard && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                      Hard Topic
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">
                  {session.topic_name}
                </h4>

                {session.notes && (
                  <p className="text-xs text-slate-500 italic">
                    Reason: "{session.notes}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onOpenSession(session)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Study Now</span>
                </button>

                <button
                  onClick={() => handleRescheduleSingle(session.id)}
                  disabled={isRescheduling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reschedule to Future</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
