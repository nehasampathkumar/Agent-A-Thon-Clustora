import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Shuffle,
  Layers,
  Brain,
  Check,
  Filter,
} from 'lucide-react';
import { StudyPlan, StudySession } from '../types';
import { api } from '../lib/api';

interface PlanViewProps {
  plan: StudyPlan | null;
  onPlanApproved: () => void;
  onOpenSession: (session: StudySession) => void;
  onOpenExamConfig: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  plan,
  onPlanApproved,
  onOpenSession,
  onOpenExamConfig,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isApproving, setIsApproving] = useState(false);

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">No Study Plan Generated Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Set your exam date and daily study hours to allow the adaptive engine to construct your day-by-day interleaved schedule.
          </p>
        </div>
        <button
          onClick={onOpenExamConfig}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Configure Exam & Generate Plan
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await api.approvePlan();
      onPlanApproved();
    } catch (err) {
      console.error('Failed to approve plan:', err);
    } finally {
      setIsApproving(false);
    }
  };

  // Get unique subjects in the plan for filtering
  const allSessions = plan.days.flatMap(d => d.sessions);
  const subjectsMap = new Map<string, string>();
  allSessions.forEach(s => {
    const id = s.subject_id || s.subjectId;
    const name = s.subject_name || s.subjectName;
    if (id && name) subjectsMap.set(id, name);
  });
  const uniqueSubjects = Array.from(subjectsMap.entries());

  // Active day selection
  const activeDay = selectedDate
    ? plan.days.find(d => d.date === selectedDate) || plan.days[0]
    : plan.days[0];

  const filteredSessions = (activeDay?.sessions || []).filter(s => {
    if (filterSubject !== 'all' && (s.subject_id || s.subjectId) !== filterSubject) return false;
    return true;
  });

  const totalMin = plan.totalMinutes ?? (plan.totalHours ? plan.totalHours * 60 : 0);
  const totalHours = Math.round((totalMin / 60) * 10) / 10;
  const isDraft = plan.status === 'draft';

  return (
    <div className="space-y-6">
      {/* Draft Approval Banner */}
      {isDraft ? (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Draft Adaptive Plan Ready for Your Approval
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {plan.daysCount} days generated • {totalHours} total study hours • Hard topics received +50% time and subjects are interleaved daily.
              </p>
            </div>
          </div>

          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isApproving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Approve & Activate Plan</span>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-950">Active Approved Study Plan</span>
              <p className="text-[11px] text-emerald-700">
                Paced for {plan.examTitle} (Exam: {plan.examDate})
              </p>
            </div>
          </div>

          <button
            onClick={onOpenExamConfig}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
          >
            Adjust Dates or Daily Hours
          </button>
        </div>
      )}

      {/* Plan Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Timeline</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{plan.daysCount} Days</p>
          <p className="text-[10px] text-slate-400">Until exam day</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Study Time</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{totalHours} Hours</p>
          <p className="text-[10px] text-slate-400">Target: {plan.dailyStudyHours} hrs/day</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Sessions</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{allSessions.length} Sessions</p>
          <p className="text-[10px] text-slate-400">Interleaved by topic</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Hard Topics Boost</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">+50% Weight</p>
          <p className="text-[10px] text-slate-400">Extended deep dives</p>
        </div>
      </div>

      {/* Main Timeline Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Day Selector Carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Timeline Days ({plan.days.length})
            </h4>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 text-slate-700"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {plan.days.map((day, idx) => {
              const isSelected = (selectedDate === null && idx === 0) || selectedDate === day.date;
              const hasCompleted = day.sessions.some(s => s.status === 'completed');
              const hasMissed = day.sessions.some(s => s.status === 'missed');
              const dayHours = Math.round((day.totalMinutes / 60) * 10) / 10;

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex flex-col items-center min-w-[100px] p-3 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Day {day.dayIndex}
                  </span>
                  <span className="font-extrabold text-sm my-0.5">
                    {day.formattedDate.split(',')[0]}
                  </span>
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {dayHours} hrs
                  </span>

                  {/* Status Indicator Dots */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {hasCompleted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has completed sessions" />
                    )}
                    {hasMissed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Has missed sessions" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day's Sessions List */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Day {activeDay?.dayIndex} • {activeDay?.formattedDate}
              </h4>
              <p className="text-xs text-slate-500">
                {activeDay?.sessions.length} scheduled sessions • {Math.round(((activeDay?.totalMinutes || 0) / 60) * 10) / 10} hours study target
              </p>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No sessions match the selected filter on this day.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session, sIdx) => {
                const isCompleted = session.status === 'completed';
                const isMissed = session.status === 'missed';

                return (
                  <div
                    key={session.id || sIdx}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isMissed
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center justify-center shrink-0 w-16 py-1 bg-slate-100 rounded-xl text-center border border-slate-200/70">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {session.start_time}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {session.durationMinutes || 45}m
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

                        <h5 className="font-bold text-sm text-slate-900">
                          {session.topic_name}
                        </h5>

                        {session.notes && (
                          <p className="text-xs text-slate-500 line-clamp-1 italic">
                            "{session.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isCompleted ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      ) : isMissed ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>In Backlog</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenSession(session)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Study Session</span>
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
    </div>
  );
};
