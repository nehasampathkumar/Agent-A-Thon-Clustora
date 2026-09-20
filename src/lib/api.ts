/**
 * StudySync AI - API Client
 */

import {
  User,
  Subject,
  UploadedNoteFile,
  Topic,
  ExamConfig,
  StudyPlan,
  StudySession,
  ProgressMetrics,
  Flashcard,
  QuizQuestion,
  ChatMessage,
} from '../types';

const TOKEN_KEY = 'studysync_jwt_token';
const USER_KEY = 'studysync_user_cache';

export const authState = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getCachedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setCachedUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = authState.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(email: string, password: string, fullName?: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (res.token) {
      authState.setToken(res.token);
      authState.setCachedUser(res.user);
    }
    return res;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      authState.setToken(res.token);
      authState.setCachedUser(res.user);
    }
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return fetchWithAuth('/api/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string; debugCode?: string }> {
    return fetchWithAuth('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    return fetchWithAuth('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return fetchWithAuth('/api/subjects');
  },

  async createSubject(data: { name: string; color: string; icon?: string; description?: string }): Promise<Subject> {
    return fetchWithAuth('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteSubject(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Files
  async getFiles(): Promise<UploadedNoteFile[]> {
    return fetchWithAuth('/api/files');
  },

  async uploadFile(data: {
    subjectId: string;
    fileName: string;
    fileType: string;
    contentBase64?: string;
    rawText?: string;
  }): Promise<{ file: UploadedNoteFile; extractedTopicsCount: number; topics: any[] }> {
    return fetchWithAuth('/api/files/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteFile(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/files/${id}`, {
      method: 'DELETE',
    });
  },

  // Topics
  async getTopics(subjectId?: string): Promise<Topic[]> {
    const url = subjectId ? `/api/topics?subjectId=${encodeURIComponent(subjectId)}` : '/api/topics';
    return fetchWithAuth(url);
  },

  async createTopic(data: Partial<Topic>): Promise<Topic> {
    return fetchWithAuth('/api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleTopicHard(id: string): Promise<{ id: string; isHard: boolean; difficulty: number }> {
    return fetchWithAuth(`/api/topics/${id}/toggle-hard`, {
      method: 'PATCH',
    });
  },

  async deleteTopic(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/topics/${id}`, {
      method: 'DELETE',
    });
  },

  // Exam Config
  async getExamConfig(): Promise<ExamConfig | null> {
    return fetchWithAuth('/api/exam');
  },

  async saveExamConfig(data: ExamConfig): Promise<ExamConfig> {
    return fetchWithAuth('/api/exam', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Plan
  async generatePlan(data: {
    examTitle: string;
    examDate: string;
    dailyStudyHours: number;
    startTime: string;
  }): Promise<{ plan: StudyPlan; sessionsCount: number }> {
    return fetchWithAuth('/api/plan/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPlan(): Promise<StudyPlan | null> {
    return fetchWithAuth('/api/plan');
  },

  async approvePlan(): Promise<{ message: string }> {
    return fetchWithAuth('/api/plan/approve', {
      method: 'POST',
    });
  },

  async reschedulePlan(sessionIds: string[] = []): Promise<{ message: string; rescheduledCount: number }> {
    return fetchWithAuth('/api/plan/reschedule', {
      method: 'POST',
      body: JSON.stringify({ sessionIds }),
    });
  },

  // Sessions
  async completeSession(id: string, notes?: string): Promise<StudySession> {
    return fetchWithAuth(`/api/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async markSessionMissed(id: string, notes?: string): Promise<StudySession> {
    return fetchWithAuth(`/api/sessions/${id}/miss`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async getBacklog(): Promise<StudySession[]> {
    return fetchWithAuth('/api/backlog');
  },

  // Progress & History
  async getProgress(): Promise<ProgressMetrics> {
    return fetchWithAuth('/api/progress');
  },

  async getHistory(): Promise<StudySession[]> {
    return fetchWithAuth('/api/history');
  },

  // AI Routes
  async extractTopicsAI(text: string, subjectName?: string): Promise<{ topics: any[] }> {
    return fetchWithAuth('/api/ai/extract-topics', {
      method: 'POST',
      body: JSON.stringify({ text, subjectName }),
    });
  },

  async generateFlashcardsAI(topicName: string, subjectName?: string, notesText?: string): Promise<{ flashcards: Flashcard[] }> {
    return fetchWithAuth('/api/ai/generate-flashcards', {
      method: 'POST',
      body: JSON.stringify({ topicName, subjectName, notesText }),
    });
  },

  async generateQuizAI(topicName: string, subjectName?: string, notesText?: string): Promise<{ questions: QuizQuestion[] }> {
    return fetchWithAuth('/api/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ topicName, subjectName, notesText }),
    });
  },

  async chatAI(messages: { role: string; content: string }[]): Promise<{ text: string; sources?: string[] }> {
    return fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  },
};
