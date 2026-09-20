import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertCircle,
  Brain,
  HelpCircle,
  FileText,
  Flame,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession, Flashcard, QuizQuestion } from '../types';
import { api } from '../lib/api';

interface SessionPlayerModalProps {
  session: StudySession | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
}

export const SessionPlayerModal: React.FC<SessionPlayerModalProps> = ({
  session,
  isOpen,
  onClose,
  onSessionUpdated,
}) => {
  if (!isOpen || !session) return null;

  const durationMin = session.durationMinutes || 45;
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'flashcards' | 'quiz' | 'notes'>('timer');

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(durationMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<any>(null);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsMastered, setCardsMastered] = useState<Set<number>>(new Set());
  const [loadingCards, setLoadingCards] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Notes & Completion
  const [studyNotes, setStudyNotes] = useState(session.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Reset timer if session changes
  useEffect(() => {
    setSecondsRemaining(durationMin * 60);
    setIsRunning(false);
    setStudyNotes(session.notes || '');
    setCompletedSuccess(false);
    setSelectedAnswers({});
    setCurrentCardIdx(0);
    setCurrentQuizIdx(0);
    setIsFlipped(false);
    setCardsMastered(new Set());
  }, [session.id, durationMin]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (soundEnabled) playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  // Load Flashcards when tab is opened
  useEffect(() => {
    if (activeSubTab === 'flashcards' && flashcards.length === 0) {
      loadFlashcards();
    } else if (activeSubTab === 'quiz' && quizQuestions.length === 0) {
      loadQuiz();
    }
  }, [activeSubTab]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // audio context not available
    }
  };

  const sessionTopic = session.topic_name || session.topicName || 'Study Topic';
  const sessionSubject = session.subject_name || session.subjectName || 'General Subject';

  const loadFlashcards = async () => {
    setLoadingCards(true);
    try {
      const res = await api.generateFlashcardsAI(sessionTopic, sessionSubject);
      setFlashcards(res.flashcards || []);
    } catch {
      // Fallback local cards
      setFlashcards([
        {
          id: '1',
          topicName: sessionTopic,
          question: `What are the core foundational definitions of ${sessionTopic}?`,
          answer: `The primary theoretical model, key variables, and operating assumptions defined in the study syllabus.`,
        },
        {
          id: '2',
          topicName: sessionTopic,
          question: `What are common edge cases or exam pitfalls in this topic?`,
          answer: `Confusing initial conditions with boundary limits, or omitting required intermediate formulas and derivations.`,
        },
        {
          id: '3',
          topicName: sessionTopic,
          question: `How do you verify your answer when solving questions on this topic?`,
          answer: `Check units, verify limiting behavior, and test with simple known boundary values.`,
        },
      ]);
    } finally {
      setLoadingCards(false);
    }
  };

  const loadQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const res = await api.generateQuizAI(sessionTopic, sessionSubject);
      setQuizQuestions(res.questions || []);
    } catch {
      setQuizQuestions([
        {
          id: '1',
          topicName: sessionTopic,
          question: `Which strategy yields the highest marks for ${sessionTopic} questions?`,
          options: [
            'Immediately guessing the numerical output',
            'Listing known variables, governing formulas, and showing step-by-step logic',
            'Skipping verification of boundary units',
            'Rewriting the question verbatim without solution',
          ],
          correctIndex: 1,
          explanation: 'Exam rubrics heavily weight explicit declaration of governing equations and clear derivation steps.',
        },
        {
          id: '2',
          topicName: sessionTopic,
          question: `What is the most effective approach to mastering hard topics?`,
          options: [
            'Passive rereading without testing active recall',
            'Timed active recall drills, flashcard spaced reviews, and practice questions',
            'Highlighting textbook passages in different colors',
            'Studying only on the night preceding the exam',
          ],
          correctIndex: 1,
          explanation: 'Cognitive science demonstrates spaced retrieval practice produces 2-3x higher long-term retention than passive reading.',
        },
      ]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleCompleteSession = async () => {
    setIsSubmitting(true);
    try {
      await api.completeSession(session.id, studyNotes);
      setCompletedSuccess(true);
      // Fire celebration confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        onSessionUpdated();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to complete session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkMissed = async () => {
    if (!confirm('Send this session to your backlog? You can reschedule it with one click into your upcoming schedule.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.markSessionMissed(session.id, studyNotes);
      onSessionUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to mark session missed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer formatting
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = ((durationMin * 60 - secondsRemaining) / (durationMin * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        id="session-player-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: session.subject_color || '#6366F1' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {session.subject_name}
                </span>
                {session.is_hard && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                    <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                    Hard Topic
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/60 capitalize">
                  {(session.session_type || session.sessionType || 'study').replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {sessionTopic}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs: Timer, Flashcards, Quiz, Notes */}
        <div className="flex items-center justify-around border-b border-slate-100 bg-slate-50/50 px-4 py-2">
          <button
            onClick={() => setActiveSubTab('timer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeSubTab === 'timer'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⏱️ Timer ({minutes}m)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeSubTab === 'flashcards'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeSubTab === 'quiz'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-600" />
            <span>Practice Quiz</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeSubTab === 'notes'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Session Notes</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: POMODORO TIMER */}
          {activeSubTab === 'timer' && (
            <div className="flex flex-col items-center justify-center py-4">
              {/* Circular Progress Display */}
              <div className="relative w-56 h-56 rounded-full flex items-center justify-center bg-slate-50 border-4 border-slate-100 shadow-inner">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r="98"
                    stroke="#EEF2FF"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r="98"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 98}
                    strokeDashoffset={2 * Math.PI * 98 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                <div className="text-center z-10">
                  <span className="font-mono text-5xl font-extrabold text-slate-900 tracking-tight">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {isRunning ? 'Focused Study Time' : secondsRemaining === 0 ? 'Session Complete!' : 'Paused'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setSecondsRemaining(durationMin * 60)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>{secondsRemaining < durationMin * 60 ? 'Resume Study' : 'Start Focus Timer'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSecondsRemaining(Math.max(0, secondsRemaining - 300))}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="Skip 5 minutes forward"
                >
                  <FastForward className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-8 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl max-w-md w-full text-center">
                <p className="text-xs text-slate-600 font-medium">
                  💡 <strong>Study Tip:</strong> While your timer runs, switch to the <strong>Flashcards</strong> or <strong>Practice Quiz</strong> tab to test active recall without interrupting your countdown.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FLASHCARDS */}
          {activeSubTab === 'flashcards' && (
            <div className="py-2">
              {loadingCards ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Pulling flashcards from student notes...</p>
                </div>
              ) : flashcards.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">No flashcards found. Click below to generate from notes:</p>
                  <button
                    onClick={loadFlashcards}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                  >
                    Generate AI Flashcards
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Progress info */}
                  <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 mb-3 px-1">
                    <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                    <span className="text-emerald-600 font-bold">
                      {cardsMastered.size} Mastered
                    </span>
                  </div>

                  {/* 3D Flip Card Container */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-64 cursor-pointer select-none perspective-1000 group"
                  >
                    <div
                      className={`relative w-full h-full rounded-2xl p-6 text-center transition-all duration-300 transform flex flex-col justify-between border shadow-sm ${
                        isFlipped
                          ? 'bg-indigo-900 text-white border-indigo-700'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold uppercase tracking-wider ${isFlipped ? 'text-indigo-300' : 'text-slate-400'}`}>
                          {isFlipped ? 'Answer & Explanation' : 'Question (Click to flip)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFlipped ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sessionTopic}
                        </span>
                      </div>

                      <div className="my-auto px-4">
                        <p className={`text-base sm:text-lg font-bold leading-relaxed ${isFlipped ? 'text-indigo-50' : 'text-slate-800'}`}>
                          {isFlipped
                            ? flashcards[currentCardIdx]?.answer
                            : flashcards[currentCardIdx]?.question}
                        </p>
                      </div>

                      <p className={`text-[11px] font-medium ${isFlipped ? 'text-indigo-300' : 'text-slate-400'}`}>
                        {isFlipped ? 'Click card to see question' : 'Click card to reveal answer'}
                      </p>
                    </div>
                  </div>

                  {/* Card navigation & confidence ratings */}
                  <div className="w-full flex items-center justify-between gap-3 mt-4">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx(prev => Math.max(0, prev - 1));
                      }}
                      disabled={currentCardIdx === 0}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextMastered = new Set(cardsMastered);
                          nextMastered.delete(currentCardIdx);
                          setCardsMastered(nextMastered);
                          setIsFlipped(false);
                          if (currentCardIdx < flashcards.length - 1) {
                            setCurrentCardIdx(c => c + 1);
                          }
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Needs Review
                      </button>
                      <button
                        onClick={() => {
                          const nextMastered = new Set(cardsMastered);
                          nextMastered.add(currentCardIdx);
                          setCardsMastered(nextMastered);
                          setIsFlipped(false);
                          if (currentCardIdx < flashcards.length - 1) {
                            setCurrentCardIdx(c => c + 1);
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        ✓ Mastered
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                      }}
                      disabled={currentCardIdx === flashcards.length - 1}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRACTICE QUIZ */}
          {activeSubTab === 'quiz' && (
            <div className="py-2">
              {loadingQuiz ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Synthesizing multiple-choice questions from study material...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">No quiz questions generated yet.</p>
                  <button
                    onClick={loadQuiz}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                  >
                    Generate Practice Quiz
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4">
                    <span>Question {currentQuizIdx + 1} of {quizQuestions.length}</span>
                    <span className="font-bold text-indigo-600">
                      Score: {Object.entries(selectedAnswers).filter(([idx, ans]) => quizQuestions[Number(idx)]?.correctIndex === ans).length} / {Object.keys(selectedAnswers).length}
                    </span>
                  </div>

                  {(() => {
                    const q = quizQuestions[currentQuizIdx];
                    if (!q) return null;
                    const answered = selectedAnswers[currentQuizIdx] !== undefined;
                    const selectedAns = selectedAnswers[currentQuizIdx];

                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <p className="text-sm sm:text-base font-bold text-slate-900">
                            {q.question}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = selectedAns === oIdx;
                            const isCorrect = q.correctIndex === oIdx;

                            let btnStyle = 'border-slate-200 bg-white hover:border-indigo-300 text-slate-800';
                            if (answered) {
                              if (isCorrect) {
                                btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-400';
                              } else if (isChosen && !isCorrect) {
                                btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-2 ring-rose-400';
                              } else {
                                btnStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={answered}
                                onClick={() => {
                                  setSelectedAnswers({
                                    ...selectedAnswers,
                                    [currentQuizIdx]: oIdx,
                                  });
                                }}
                                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[11px] font-bold">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation when answered */}
                        {answered && (
                          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950">
                            <p className="font-bold flex items-center gap-1.5 mb-1">
                              <HelpCircle className="w-4 h-4 text-indigo-600" />
                              Explanation:
                            </p>
                            <p>{q.explanation}</p>
                          </div>
                        )}

                        {/* Next Question Navigation */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => setCurrentQuizIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentQuizIdx === 0}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          >
                            ← Previous
                          </button>

                          <button
                            onClick={() => setCurrentQuizIdx(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                            disabled={currentQuizIdx === quizQuestions.length - 1}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-30 cursor-pointer"
                          >
                            Next Question →
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SESSION NOTES */}
          {activeSubTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Takeaways & Formulas Mastered
                </label>
                <textarea
                  rows={6}
                  value={studyNotes}
                  onChange={e => setStudyNotes(e.target.value)}
                  placeholder="Record summary concepts, formulas you struggled with, or specific notes for your upcoming exam..."
                  className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <p>
                  These takeaways are attached to your completed session history and indexed by your floating AI study companion.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/90">
          <button
            onClick={handleMarkMissed}
            disabled={isSubmitting || completedSuccess}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            Mark as Missed (Send to Backlog)
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleCompleteSession}
              disabled={isSubmitting || completedSuccess}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {completedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Session Saved! 🎉</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
