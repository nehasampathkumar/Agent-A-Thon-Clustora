import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  Flame,
  Shuffle,
  RotateCcw,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ExamConfig } from '../types';
import { api } from '../lib/api';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig | null;
  onConfigSaved: (config: ExamConfig, planGenerated?: boolean) => void;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigSaved,
}) => {
  if (!isOpen) return null;

  // Default exam date: 14 days from today
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [examTitle, setExamTitle] = useState(config?.examTitle || 'Spring Final Examinations');
  const [examDate, setExamDate] = useState(config?.examDate || defaultDateStr);
  const [dailyHours, setDailyHours] = useState(config?.dailyStudyHours || 3.5);
  const [startTime, setStartTime] = useState(config?.startTime || '09:00');
  const [targetScore, setTargetScore] = useState(config?.targetScore || 'A+ (95%+)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setExamTitle(config.examTitle);
      setExamDate(config.examDate);
      setDailyHours(config.dailyStudyHours);
      setStartTime(config.startTime);
      if (config.targetScore) setTargetScore(config.targetScore);
    }
  }, [config]);

  // Calculate days count
  const target = new Date(examDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const totalStudyHoursEst = Math.round(daysDiff * dailyHours);

  const handleSaveAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const savedConfig = await api.saveExamConfig({
        examTitle,
        examDate,
        dailyStudyHours: Number(dailyHours),
        startTime,
        targetScore,
      });

      // Call generate plan
      await api.generatePlan({
        examTitle,
        examDate,
        dailyStudyHours: Number(dailyHours),
        startTime,
      });

      onConfigSaved(savedConfig, true);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        id="exam-config-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Exam Date & Study Hours</h2>
              <p className="text-xs text-slate-500">Configure your parameters to generate an adaptive study schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSaveAndGenerate} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Exam Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Exam or Goal Title
            </label>
            <input
              type="text"
              required
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
              placeholder="e.g. AP Biology & CS Board Exam"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Exam Date & Daily Start Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exam Date</span>
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] font-semibold text-indigo-700 mt-1">
                ⏱️ {daysDiff} days until exam
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Daily Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                First session begins each day at this time
              </p>
            </div>
          </div>

          {/* Daily Study Hours Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Daily Study Hours Target
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200/60">
                {dailyHours} hours / day
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={dailyHours}
              onChange={e => setDailyHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 hr (Light)</span>
              <span>3.5 hrs (Balanced)</span>
              <span>6 hrs (Intense)</span>
              <span>8 hrs (Sprint)</span>
            </div>
          </div>

          {/* Target Score or Grade */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Score / Grade Goal</span>
            </label>
            <input
              type="text"
              value={targetScore}
              onChange={e => setTargetScore(e.target.value)}
              placeholder="e.g. 95%+, Grade A, Top 5%"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Estimated Calculations Banner */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-2">
              <span>Adaptive Plan Projection</span>
              <span className="text-indigo-600">~{totalStudyHoursEst} Total Study Hours</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-center gap-1 text-amber-600 font-bold mb-0.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>+50% Time</span>
                </div>
                <span className="text-[10px] text-slate-600">Hard topics prioritized</span>
              </div>

              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold mb-0.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Interleaved</span>
                </div>
                <span className="text-[10px] text-slate-600">Subjects mixed daily</span>
              </div>

              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold mb-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Spaced Rev.</span>
                </div>
                <span className="text-[10px] text-slate-600">Every 3 days + final</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Building Adaptive Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Adaptive Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
