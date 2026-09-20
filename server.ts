import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  getDB,
  saveDB,
  generateId,
  DBUser,
  DBSubject,
  DBFile,
  DBTopic,
  DBExamConfig,
  DBSession,
  DBStudyPlan,
  DBActivity,
} from './server/db.js';
import { extractTextFromFile } from './server/textExtractor.js';
import {
  extractTopicsFromNotes,
  generateFlashcardsAI,
  generateQuizAI,
  chatWithStudentNotes,
} from './server/aiService.js';
import {
  buildAdaptivePlan,
  rescheduleMissedSessions,
} from './server/planBuilder.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'studysync-jwt-dev-secret-key-2026';
const PORT = 3000;

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

// Authentication middleware
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const db = getDB();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; fullName: string };
      const existingUser = db.users.find(u => u.id === decoded.id);
      if (existingUser) {
        req.user = {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.full_name,
        };
        return next();
      }
    } catch {
      // Invalid token, fall through to check demo fallback
    }
  }

  // Graceful fallback to default demo user if header is omitted or demo mode
  const defaultUser = db.users[0];
  if (defaultUser) {
    req.user = {
      id: defaultUser.id,
      email: defaultUser.email,
      fullName: defaultUser.full_name,
    };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 30mb for document uploads
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // ==========================================
  // AUTHENTICATION APIs
  // ==========================================

  // Signup
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser: DBUser = {
      id: generateId('user'),
      email: email.toLowerCase().trim(),
      password_hash: bcrypt.hashSync(password, 8),
      full_name: full_name || email.split('@')[0],
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDB();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, fullName: newUser.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        createdAt: newUser.created_at,
      },
    });
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
      },
    });
  });

  // Current user /me
  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // Forgot Password (generates 6-digit code)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.reset_code = code;
    user.reset_code_expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    saveDB();

    // Return the reset code in the response for direct frictionless testing
    res.json({
      message: 'A 6-digit verification code has been dispatched.',
      debugCode: code,
    });
  });

  // Reset Password with 6-digit code
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Email, 6-digit code, and new password are required' });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.reset_code || user.reset_code !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (user.reset_code_expires && Date.now() > user.reset_code_expires) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    user.password_hash = bcrypt.hashSync(new_password, 8);
    user.reset_code = undefined;
    user.reset_code_expires = undefined;
    saveDB();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  });

  // ==========================================
  // SUBJECTS & FILES MANAGEMENT
  // ==========================================

  // List subjects
  app.get('/api/subjects', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const userSubjects = db.subjects.filter(s => s.user_id === userId);

    const enriched = userSubjects.map(s => {
      const subjectTopics = db.topics.filter(t => t.subject_id === s.id);
      const subjectFiles = db.files.filter(f => f.subject_id === s.id);
      const hardCount = subjectTopics.filter(t => t.is_hard).length;

      return {
        id: s.id,
        userId: s.user_id,
        name: s.name,
        color: s.color,
        icon: s.icon,
        description: s.description,
        topicCount: subjectTopics.length,
        hardTopicCount: hardCount,
        fileCount: subjectFiles.length,
        createdAt: s.created_at,
      };
    });

    res.json(enriched);
  });

  // Create subject
  app.post('/api/subjects', authMiddleware, (req: AuthRequest, res: Response) => {
    const { name, color, icon, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const db = getDB();
    const newSubject: DBSubject = {
      id: generateId('subj'),
      user_id: req.user!.id,
      name: name.trim(),
      color: color || '#6366F1',
      icon: icon || 'book',
      description: description || '',
      created_at: new Date().toISOString(),
    };

    db.subjects.push(newSubject);
    saveDB();

    res.status(201).json(newSubject);
  });

  // Delete subject
  app.delete('/api/subjects/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const subjId = req.params.id;

    db.subjects = db.subjects.filter(s => !(s.id === subjId && s.user_id === userId));
    db.files = db.files.filter(f => f.subject_id !== subjId);
    db.topics = db.topics.filter(t => t.subject_id !== subjId);
    db.sessions = db.sessions.filter(s => s.subject_id !== subjId);
    saveDB();

    res.json({ message: 'Subject and related data deleted' });
  });

  // List files
  app.get('/api/files', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const files = db.files.filter(f => f.user_id === userId);

    const mapped = files.map(f => {
      const subj = db.subjects.find(s => s.id === f.subject_id);
      return {
        id: f.id,
        userId: f.user_id,
        subjectId: f.subject_id,
        subjectName: subj ? subj.name : 'Unknown Subject',
        fileName: f.file_name,
        fileType: f.file_type,
        sizeBytes: f.size_bytes,
        extractedText: f.extracted_text,
        wordCount: f.word_count,
        uploadedAt: f.uploaded_at,
      };
    });

    res.json(mapped);
  });

  // Upload file & extract text
  app.post('/api/files/upload', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { subjectId, fileName, fileType, contentBase64, rawText } = req.body;

    if (!subjectId || !fileName) {
      return res.status(400).json({ error: 'subjectId and fileName are required' });
    }

    const db = getDB();
    const subj = db.subjects.find(s => s.id === subjectId);
    if (!subj) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    let bufferOrText: Buffer | string = rawText || '';
    if (contentBase64) {
      bufferOrText = Buffer.from(contentBase64, 'base64');
    }

    const extracted = extractTextFromFile(fileName, fileType, bufferOrText);
    const fileId = generateId('file');

    const newFile: DBFile = {
      id: fileId,
      user_id: req.user!.id,
      subject_id: subjectId,
      file_name: fileName,
      file_type: fileType || 'text',
      size_bytes: Buffer.isBuffer(bufferOrText) ? bufferOrText.length : Buffer.byteLength(String(bufferOrText)),
      extracted_text: extracted.text,
      word_count: extracted.wordCount,
      uploaded_at: new Date().toISOString(),
    };

    db.files.push(newFile);

    // Auto-extract topics from the uploaded material!
    const extractedTopics = await extractTopicsFromNotes(extracted.text, subj.name);

    for (const top of extractedTopics) {
      const newTopic: DBTopic = {
        id: generateId('top'),
        user_id: req.user!.id,
        subject_id: subjectId,
        name: top.name,
        difficulty: top.difficulty,
        is_hard: top.isHard,
        estimated_hours: top.estimatedHours,
        key_concepts: top.keyConcepts,
        summary: top.summary,
        source_file_id: fileId,
      };
      db.topics.push(newTopic);
    }

    saveDB();

    res.status(201).json({
      file: {
        id: newFile.id,
        subjectId: newFile.subject_id,
        fileName: newFile.file_name,
        fileType: newFile.file_type,
        sizeBytes: newFile.size_bytes,
        wordCount: newFile.word_count,
        snippet: extracted.snippet,
        extractedText: extracted.text,
        uploadedAt: newFile.uploaded_at,
      },
      extractedTopicsCount: extractedTopics.length,
      topics: extractedTopics,
    });
  });

  // Delete file
  app.delete('/api/files/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const fileId = req.params.id;

    db.files = db.files.filter(f => !(f.id === fileId && f.user_id === userId));
    saveDB();

    res.json({ message: 'File deleted' });
  });

  // ==========================================
  // TOPICS MANAGEMENT
  // ==========================================

  // List topics
  app.get('/api/topics', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const { subjectId } = req.query;

    let topics = db.topics.filter(t => t.user_id === userId);
    if (subjectId) {
      topics = topics.filter(t => t.subject_id === String(subjectId));
    }

    const mapped = topics.map(t => {
      const subj = db.subjects.find(s => s.id === t.subject_id);
      return {
        id: t.id,
        userId: t.user_id,
        subjectId: t.subject_id,
        subjectName: subj ? subj.name : 'Unknown Subject',
        name: t.name,
        difficulty: t.difficulty,
        isHard: t.is_hard,
        estimatedHours: t.estimated_hours,
        keyConcepts: t.key_concepts || [],
        summary: t.summary || '',
        sourceFileId: t.source_file_id,
      };
    });

    res.json(mapped);
  });

  // Create topic
  app.post('/api/topics', authMiddleware, (req: AuthRequest, res: Response) => {
    const { subjectId, name, difficulty = 3, isHard = false, estimatedHours = 2, keyConcepts = [], summary = '' } = req.body;
    if (!subjectId || !name) {
      return res.status(400).json({ error: 'subjectId and topic name are required' });
    }

    const db = getDB();
    const newTopic: DBTopic = {
      id: generateId('top'),
      user_id: req.user!.id,
      subject_id: subjectId,
      name: name.trim(),
      difficulty: Number(difficulty) || 3,
      is_hard: Boolean(isHard || difficulty >= 4),
      estimated_hours: Number(estimatedHours) || 2,
      key_concepts: keyConcepts,
      summary,
    };

    db.topics.push(newTopic);
    saveDB();

    res.status(201).json(newTopic);
  });

  // Toggle hard topic status
  app.patch('/api/topics/:id/toggle-hard', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const topic = db.topics.find(t => t.id === req.params.id && t.user_id === req.user!.id);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    topic.is_hard = !topic.is_hard;
    if (topic.is_hard && topic.difficulty < 4) {
      topic.difficulty = 4;
    }
    saveDB();

    res.json({ id: topic.id, isHard: topic.is_hard, difficulty: topic.difficulty });
  });

  // Delete topic
  app.delete('/api/topics/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    db.topics = db.topics.filter(t => !(t.id === req.params.id && t.user_id === req.user!.id));
    saveDB();
    res.json({ message: 'Topic deleted' });
  });

  // ==========================================
  // EXAM CONFIG & PLAN APIS
  // ==========================================

  // Get exam config
  app.get('/api/exam', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const exam = db.exam_configs.find(e => e.user_id === req.user!.id);
    res.json(exam || null);
  });

  // Save exam config
  app.post('/api/exam', authMiddleware, (req: AuthRequest, res: Response) => {
    const { examTitle, examDate, dailyStudyHours, startTime, targetScore } = req.body;
    if (!examTitle || !examDate) {
      return res.status(400).json({ error: 'examTitle and examDate are required' });
    }

    const db = getDB();
    let exam = db.exam_configs.find(e => e.user_id === req.user!.id);

    if (exam) {
      exam.exam_title = examTitle;
      exam.exam_date = examDate;
      exam.daily_study_hours = Number(dailyStudyHours) || 3;
      exam.start_time = startTime || '09:00';
      exam.target_score = targetScore || '90%';
      exam.updated_at = new Date().toISOString();
    } else {
      exam = {
        id: generateId('exam'),
        user_id: req.user!.id,
        exam_title: examTitle,
        exam_date: examDate,
        daily_study_hours: Number(dailyStudyHours) || 3,
        start_time: startTime || '09:00',
        target_score: targetScore || '90%',
        updated_at: new Date().toISOString(),
      };
      db.exam_configs.push(exam);
    }

    saveDB();
    res.json(exam);
  });

  // Generate day-by-day plan
  app.post('/api/plan/generate', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const { examTitle, examDate, dailyStudyHours = 3, startTime = '09:00' } = req.body;

    const subjects = db.subjects.filter(s => s.user_id === userId);
    const topics = db.topics.filter(t => t.user_id === userId);

    if (topics.length === 0) {
      return res.status(400).json({ error: 'Please add topics or upload study notes first to generate a plan' });
    }

    const { plan, sessions } = buildAdaptivePlan({
      userId,
      examTitle: examTitle || 'Exam Preparation Plan',
      examDate: examDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      dailyStudyHours: Number(dailyStudyHours) || 3,
      startTime: startTime || '09:00',
      subjects,
      topics,
    });

    // Remove previous draft plans for user
    db.study_plans = db.study_plans.filter(p => !(p.user_id === userId && p.status === 'draft'));
    db.study_plans.push(plan);

    // Save generated sessions
    // Remove unapproved sessions
    db.sessions = db.sessions.filter(s => s.user_id !== userId || s.status === 'completed');
    db.sessions.push(...sessions);

    db.activities.unshift({
      id: generateId('act'),
      user_id: userId,
      type: 'plan_generated',
      title: 'New Adaptive Study Plan Generated',
      subtitle: `${sessions.length} sessions across ${subjects.length} subjects`,
      timestamp: new Date().toISOString(),
    });

    saveDB();

    res.json({ plan, sessionsCount: sessions.length });
  });

  // Get active plan with structured days
  app.get('/api/plan', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;

    // Get active or draft plan
    const plan = db.study_plans.find(p => p.user_id === userId && (p.status === 'active' || p.status === 'draft'));
    const sessions = db.sessions.filter(s => s.user_id === userId);

    if (!plan && sessions.length === 0) {
      return res.json(null);
    }

    // Group sessions by date
    const dateMap = new Map<string, DBSession[]>();
    for (const s of sessions) {
      if (!dateMap.has(s.date)) dateMap.set(s.date, []);
      dateMap.get(s.date)!.push(s);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const days = sortedDates.map((dateStr, idx) => {
      const daySessions = dateMap.get(dateStr) || [];
      // Sort sessions by start_time
      daySessions.sort((a, b) => a.start_time.localeCompare(b.start_time));
      const totalMinutes = daySessions.reduce((acc, cur) => acc + (cur.duration_minutes || cur.durationMinutes || 45), 0);

      const d = new Date(dateStr + 'T00:00:00');
      const formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      return {
        date: dateStr,
        dayIndex: idx + 1,
        formattedDate,
        totalMinutes,
        sessions: daySessions,
      };
    });

    const totalMinutes = sessions.reduce((acc, cur) => acc + (cur.duration_minutes || cur.durationMinutes || 45), 0);

    const fullPlan = {
      id: plan ? plan.id : 'plan-current',
      userId,
      examTitle: plan ? plan.exam_title : 'Exam Plan',
      examDate: plan ? plan.exam_date : (sortedDates[sortedDates.length - 1] || ''),
      dailyStudyHours: plan ? plan.daily_study_hours : 3,
      startTime: plan ? plan.start_time : '09:00',
      totalDays: days.length,
      totalSessions: sessions.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      status: plan ? plan.status : 'active',
      generatedAt: plan ? plan.generated_at : new Date().toISOString(),
      approvedAt: plan ? plan.approved_at : undefined,
      days,
    };

    res.json(fullPlan);
  });

  // Approve plan
  app.post('/api/plan/approve', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const plan = db.study_plans.find(p => p.user_id === userId);

    if (plan) {
      plan.status = 'active';
      plan.approved_at = new Date().toISOString();
    }

    saveDB();
    res.json({ message: 'Study plan approved and activated!' });
  });

  // Reschedule missed sessions (one-click intelligent redistributor)
  app.post('/api/plan/reschedule', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const { sessionIds = [] } = req.body;

    const userSessions = db.sessions.filter(s => s.user_id === userId);
    const exam = db.exam_configs.find(e => e.user_id === userId);
    const dailyHours = exam ? exam.daily_study_hours : 3;

    const { updatedSessions, rescheduledCount } = rescheduleMissedSessions(
      userSessions,
      sessionIds,
      dailyHours,
      exam ? exam.start_time : '09:00'
    );

    // Replace user sessions in DB
    db.sessions = db.sessions.filter(s => s.user_id !== userId).concat(updatedSessions);

    db.activities.unshift({
      id: generateId('act'),
      user_id: userId,
      type: 'rescheduled',
      title: `Rescheduled ${rescheduledCount} Missed Session(s)`,
      subtitle: 'Smoothly redistributed into upcoming calendar without overloading daily limit',
      timestamp: new Date().toISOString(),
    });

    saveDB();

    res.json({
      message: `Successfully rescheduled ${rescheduledCount} session(s)`,
      rescheduledCount,
    });
  });

  // ==========================================
  // SESSION TRACKING & STUDY TOOLS
  // ==========================================

  // Mark session completed
  app.post('/api/sessions/:id/complete', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const { notes } = req.body;

    const session = db.sessions.find(s => s.id === req.params.id && s.user_id === userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'completed';
    session.completed_at = new Date().toISOString();
    if (notes) session.notes = notes;

    db.activities.unshift({
      id: generateId('act'),
      user_id: userId,
      type: 'completed',
      title: `Completed: ${session.topic_name}`,
      subtitle: `${session.duration_minutes || session.durationMinutes || 45} min • ${session.subject_name}`,
      timestamp: new Date().toISOString(),
    });

    saveDB();
    res.json(session);
  });

  // Mark session missed
  app.post('/api/sessions/:id/miss', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const { notes } = req.body;

    const session = db.sessions.find(s => s.id === req.params.id && s.user_id === userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'missed';
    if (notes) session.notes = notes;

    db.activities.unshift({
      id: generateId('act'),
      user_id: userId,
      type: 'missed',
      title: `Missed: ${session.topic_name}`,
      subtitle: 'Sent to study backlog for intelligent rescheduling',
      timestamp: new Date().toISOString(),
    });

    saveDB();
    res.json(session);
  });

  // Get backlog (missed sessions)
  app.get('/api/backlog', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;

    const backlogSessions = db.sessions.filter(
      s => s.user_id === userId && s.status === 'missed'
    );

    res.json(backlogSessions);
  });

  // Progress & metrics
  app.get('/api/progress', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;

    const sessions = db.sessions.filter(s => s.user_id === userId);
    const completed = sessions.filter(s => s.status === 'completed');
    const missed = sessions.filter(s => s.status === 'missed');
    const pending = sessions.filter(s => s.status === 'pending');

    const totalMinutesStudied = completed.reduce((acc, cur) => acc + (cur.duration_minutes || cur.durationMinutes || 45), 0);
    const completionRate = sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0;

    // Calculate streak (consecutive days with at least one completed session)
    const completedDates = Array.from(new Set(completed.map(s => s.date))).sort().reverse();
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (completedDates.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0 && !completedDates.includes(todayStr)) {
        // If haven't completed today yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Breakdown per subject
    const subjects = db.subjects.filter(s => s.user_id === userId);
    const subjectStats = subjects.map(subj => {
      const subjSessions = sessions.filter(s => s.subject_id === subj.id);
      const subjCompleted = subjSessions.filter(s => s.status === 'completed');

      const completedHours = Math.round((subjCompleted.reduce((a, c) => a + (c.duration_minutes || c.durationMinutes || 45), 0) / 60) * 10) / 10;
      const totalHours = Math.round((subjSessions.reduce((a, c) => a + (c.duration_minutes || c.durationMinutes || 45), 0) / 60) * 10) / 10;
      const percent = subjSessions.length > 0 ? Math.round((subjCompleted.length / subjSessions.length) * 100) : 0;

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        color: subj.color,
        completedHours,
        totalHours: Math.max(totalHours, completedHours),
        percent,
      };
    });

    const recentActivity = db.activities
      .filter(a => a.user_id === userId)
      .slice(0, 15);

    res.json({
      completedSessions: completed.length,
      totalSessions: sessions.length,
      missedSessions: missed.length,
      pendingSessions: pending.length,
      completionRate,
      totalStudyMinutes: totalMinutesStudied,
      streakDays: Math.max(streak, completed.length > 0 ? 1 : 0),
      subjectStats,
      recentActivity,
    });
  });

  // History timeline
  app.get('/api/history', authMiddleware, (req: AuthRequest, res: Response) => {
    const db = getDB();
    const userId = req.user!.id;
    const history = db.sessions
      .filter(s => s.user_id === userId && (s.status === 'completed' || s.status === 'missed' || s.status === 'rescheduled'))
      .sort((a, b) => (b.completed_at || b.date).localeCompare(a.completed_at || a.date));

    res.json(history);
  });

  // ==========================================
  // /api/ai/* ROUTES
  // ==========================================

  // Extract topics from raw text
  app.post('/api/ai/extract-topics', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { text, subjectName = 'Study Material' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      const topics = await extractTopicsFromNotes(text, subjectName);
      res.json({ topics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Topic extraction failed' });
    }
  });

  // Generate flashcards
  app.post('/api/ai/generate-flashcards', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { topicName, subjectName = '', notesText = '' } = req.body;
    if (!topicName) {
      return res.status(400).json({ error: 'topicName is required' });
    }

    const flashcards = await generateFlashcardsAI(topicName, subjectName, notesText);
    res.json({ flashcards });
  });

  // Generate quiz
  app.post('/api/ai/generate-quiz', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { topicName, subjectName = '', notesText = '' } = req.body;
    if (!topicName) {
      return res.status(400).json({ error: 'topicName is required' });
    }

    const quizQuestions = await generateQuizAI(topicName, subjectName, notesText);
    res.json({ questions: quizQuestions });
  });

  // Floating Chatbot grounded in student's own material and active plan
  app.post('/api/ai/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { messages = [] } = req.body;
    const db = getDB();
    const userId = req.user!.id;

    // Gather student context
    const userFiles = db.files.filter(f => f.user_id === userId);
    const combinedNotes = userFiles.map(f => `--- ${f.file_name} ---\n${f.extracted_text}`).join('\n\n');

    const exam = db.exam_configs.find(e => e.user_id === userId);
    const hardTopics = db.topics.filter(t => t.user_id === userId && t.is_hard).map(t => t.name);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = db.sessions
      .filter(s => s.user_id === userId && s.date === todayStr)
      .map(s => `${s.start_time} - ${s.topic_name} (${s.subject_name})`);

    const backlogCount = db.sessions.filter(s => s.user_id === userId && s.status === 'missed').length;

    let daysRemaining = 14;
    if (exam && exam.exam_date) {
      const diff = Math.round((new Date(exam.exam_date).getTime() - new Date().getTime()) / 86400000);
      daysRemaining = Math.max(0, diff);
    }

    const result = await chatWithStudentNotes(messages, {
      notesText: combinedNotes,
      examTitle: exam ? exam.exam_title : 'Upcoming Finals',
      examDate: exam ? exam.exam_date : 'Next 2 Weeks',
      daysRemaining,
      dailyHours: exam ? exam.daily_study_hours : 3,
      hardTopics,
      todaySessions,
      backlogCount,
    });

    res.json(result);
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE & PRODUCTION STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudySync AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
