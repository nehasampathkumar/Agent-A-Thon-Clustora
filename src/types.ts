/**
 * StudySync AI - Data models and interfaces
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  topicCount?: number;
  hardTopicCount?: number;
  fileCount?: number;
  createdAt: string;
}

export interface UploadedNoteFile {
  id: string;
  userId: string;
  subjectId: string;
  subject_id?: string;
  subjectName?: string;
  subject_name?: string;
  fileName: string;
  file_name?: string;
  fileType: string;
  file_type?: string;
  sizeBytes?: number;
  extractedText?: string;
  wordCount: number;
  word_count?: number;
  uploadedAt?: string;
  topicsSuggested?: string[];
}

export interface Topic {
  id: string;
  userId?: string;
  user_id?: string;
  subjectId: string;
  subject_id?: string;
  subjectName?: string;
  subject_name?: string;
  name: string;
  difficulty: number; // 1 to 5
  isHard: boolean;
  is_hard?: boolean;
  estimatedHours?: number;
  keyConcepts?: string[];
  summary: string;
  sourceFileId?: string;
  source_file_id?: string;
}

export interface ExamConfig {
  id?: string;
  userId?: string;
  examTitle: string;
  examDate: string; // YYYY-MM-DD
  dailyStudyHours: number;
  startTime: string; // HH:MM
  targetScore?: string;
  updatedAt?: string;
}

export interface Flashcard {
  id: string;
  topicId?: string;
  topicName: string;
  subjectName?: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  id: string;
  topicId?: string;
  topicName: string;
  subjectName?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySession {
  id: string;
  planId?: string;
  plan_id?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  start_time?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  subjectId?: string;
  subject_id?: string;
  subjectName?: string;
  subject_name?: string;
  subjectColor?: string;
  subject_color?: string;
  topicId?: string;
  topic_id?: string;
  topicName?: string;
  topic_name?: string;
  isHard?: boolean;
  is_hard?: boolean;
  sessionType?: string;
  session_type?: string;
  status: 'pending' | 'completed' | 'missed' | 'rescheduled';
  completedAt?: string;
  completed_at?: string;
  notes?: string;
  flashcards?: Flashcard[];
  quizQuestions?: QuizQuestion[];
}

export interface PlanDay {
  date: string;
  dayIndex: number;
  formattedDate: string;
  totalMinutes: number;
  sessions: StudySession[];
}

export interface StudyPlan {
  id: string;
  userId?: string;
  examTitle: string;
  examDate: string;
  dailyStudyHours: number;
  startTime: string;
  totalDays?: number;
  daysCount?: number;
  totalSessions?: number;
  totalHours?: number;
  totalMinutes?: number;
  status: 'draft' | 'approved' | 'active' | 'archived';
  generatedAt?: string;
  approvedAt?: string;
  days: PlanDay[];
}

export interface ProgressMetrics {
  completedSessions: number;
  totalSessions: number;
  missedSessions: number;
  pendingSessions: number;
  completionRate: number;
  totalStudyMinutes?: number;
  totalMinutesStudied?: number;
  streakDays: number;
  subjectStats: {
    subjectId: string;
    subjectName: string;
    color: string;
    completedHours: number;
    totalHours: number;
    percent: number;
  }[];
  recentActivity: {
    id: string;
    timestamp: string;
    type: 'completed' | 'missed' | 'plan_generated' | 'rescheduled';
    title: string;
    subtitle: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
}
