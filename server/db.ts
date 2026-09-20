import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studysync_db.json');

export interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  reset_code?: string;
  reset_code_expires?: number;
  created_at: string;
}

export interface DBSubject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface DBFile {
  id: string;
  user_id: string;
  subject_id: string;
  file_name: string;
  file_type: 'pdf' | 'word' | 'text' | 'markdown' | 'csv' | 'json';
  size_bytes: number;
  extracted_text: string;
  word_count: number;
  uploaded_at: string;
}

export interface DBTopic {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  difficulty: number; // 1-5
  is_hard: boolean;
  estimated_hours: number;
  key_concepts: string[];
  summary: string;
  source_file_id?: string;
}

export interface DBExamConfig {
  id: string;
  user_id: string;
  exam_title: string;
  exam_date: string;
  daily_study_hours: number;
  start_time: string;
  target_score?: string;
  updated_at: string;
}

export interface DBSession {
  id: string;
  plan_id: string;
  user_id: string;
  date: string;
  start_time: string;
  duration_minutes?: number;
  durationMinutes?: number;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_id?: string;
  topic_name: string;
  is_hard: boolean;
  session_type: 'study' | 'revision' | 'practice_quiz' | 'flashcard_drill' | 'deep_dive';
  status: 'pending' | 'completed' | 'missed' | 'rescheduled';
  completed_at?: string;
  notes?: string;
}

export interface DBStudyPlan {
  id: string;
  user_id: string;
  exam_title: string;
  exam_date: string;
  daily_study_hours: number;
  start_time: string;
  status: 'draft' | 'approved' | 'active' | 'archived';
  generated_at: string;
  approved_at?: string;
}

export interface DBActivity {
  id: string;
  user_id: string;
  type: 'completed' | 'missed' | 'plan_generated' | 'rescheduled';
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface DBSchema {
  users: DBUser[];
  subjects: DBSubject[];
  files: DBFile[];
  topics: DBTopic[];
  exam_configs: DBExamConfig[];
  study_plans: DBStudyPlan[];
  sessions: DBSession[];
  activities: DBActivity[];
}

let inMemoryDb: DBSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDemoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function createSeedData(): DBSchema {
  const demoUserId = 'demo-user-001';
  const hashedPw = bcrypt.hashSync('password123', 8);

  const subjectBioId = 'subj-bio-01';
  const subjectCsId = 'subj-cs-02';
  const subjectHistId = 'subj-hist-03';

  const initialSubjects: DBSubject[] = [
    {
      id: subjectBioId,
      user_id: demoUserId,
      name: 'AP Biology',
      color: '#10B981', // emerald
      icon: 'dna',
      description: 'Cellular metabolism, photosynthesis, genetics, and molecular biology.',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: subjectCsId,
      user_id: demoUserId,
      name: 'Data Structures & Algorithms',
      color: '#3B82F6', // blue
      icon: 'code',
      description: 'Asymptotic analysis, dynamic programming, graph traversals, and tree balance.',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: subjectHistId,
      user_id: demoUserId,
      name: 'World History',
      color: '#F59E0B', // amber
      icon: 'landmark',
      description: 'The Industrial Revolution, Cold War diplomacy, and societal revolutions.',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const initialFiles: DBFile[] = [
    {
      id: 'file-bio-01',
      user_id: demoUserId,
      subject_id: subjectBioId,
      file_name: 'Cellular_Respiration_and_ATP_Synthase.md',
      file_type: 'markdown',
      size_bytes: 4210,
      extracted_text: `# Cellular Respiration & ATP Synthesis
Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP. The stages include:
1. Glycolysis (Cytoplasm): Breaks 1 glucose (6C) into 2 pyruvates (3C), netting 2 ATP and 2 NADH. Does not require O2.
2. Pyruvate Oxidation: Converts pyruvate into Acetyl-CoA, releasing CO2 and producing NADH.
3. Krebs Cycle (Citric Acid Cycle) in the mitochondrial matrix: Oxidizes Acetyl-CoA to produce 2 ATP, 6 NADH, 2 FADH2, and CO2.
4. Oxidative Phosphorylation & Electron Transport Chain (ETC): Electrons flow down complexes I-IV on inner mitochondrial membrane.
Key Enzyme: ATP Synthase uses the proton gradient (chemiosmosis) across the inner mitochondrial membrane to generate ~28-32 ATP.
Cyanide and carbon monoxide inhibit Complex IV (Cytochrome c oxidase), halting ATP synthesis.`,
      word_count: 140,
      uploaded_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'file-cs-01',
      user_id: demoUserId,
      subject_id: subjectCsId,
      file_name: 'Dynamic_Programming_Mastery.txt',
      file_type: 'text',
      size_bytes: 3890,
      extracted_text: `Dynamic Programming Guide
Core characteristics:
1. Overlapping Subproblems: The same subproblems are solved repeatedly (unlike divide and conquer where subproblems are disjoint).
2. Optimal Substructure: An optimal solution to the problem contains within it optimal solutions to subproblems.

Approaches:
- Top-down with Memoization: Recursion + cache table.
- Bottom-up Tabulation: Iterative table filling, saving call stack overhead.

Classic Problems:
1. 0/1 Knapsack: DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i]] + value[i]). Space optimization to O(W) by iterating backwards.
2. Longest Common Subsequence (LCS): Match yields 1 + DP[i-1][j-1], mismatch yields max(DP[i-1][j], DP[i][j-1]).
3. Bellman-Ford & Floyd-Warshall shortest path algorithms.
Complexity: Space-time trade-off. Watch state explosion.`,
      word_count: 125,
      uploaded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  const initialTopics: DBTopic[] = [
    {
      id: 'top-bio-01',
      user_id: demoUserId,
      subject_id: subjectBioId,
      name: 'Cellular Respiration & Chemiosmosis',
      difficulty: 4,
      is_hard: true,
      estimated_hours: 3.5,
      key_concepts: ['Glycolysis', 'Krebs Cycle', 'Electron Transport Chain', 'ATP Synthase proton gradient'],
      summary: 'Biochemical pathways producing ATP via substrate-level and oxidative phosphorylation.',
      source_file_id: 'file-bio-01',
    },
    {
      id: 'top-bio-02',
      user_id: demoUserId,
      subject_id: subjectBioId,
      name: 'Photosynthesis & Calvin Cycle',
      difficulty: 3,
      is_hard: false,
      estimated_hours: 2.5,
      key_concepts: ['Light Reactions', 'Photosystem II & I', 'Rubisco', 'Calvin Cycle carbon fixation'],
      summary: 'Conversion of solar photons to chemical sugars in chloroplast thylakoids and stroma.',
    },
    {
      id: 'top-bio-03',
      user_id: demoUserId,
      subject_id: subjectBioId,
      name: 'Mendelian & Molecular Genetics',
      difficulty: 4,
      is_hard: true,
      estimated_hours: 4.0,
      key_concepts: ['Punnett Squares', 'Epistasis', 'DNA Polymerase', 'Transcription & Translation'],
      summary: 'Gene inheritance patterns, chromosomal crossover, and central dogma protein synthesis.',
    },
    {
      id: 'top-cs-01',
      user_id: demoUserId,
      subject_id: subjectCsId,
      name: 'Dynamic Programming Patterns',
      difficulty: 5,
      is_hard: true,
      estimated_hours: 4.5,
      key_concepts: ['Memoization vs Tabulation', '0/1 Knapsack', 'LCS', 'State transitions'],
      summary: 'Solving optimal substructure problems with overlapping subproblems efficiently.',
      source_file_id: 'file-cs-01',
    },
    {
      id: 'top-cs-02',
      user_id: demoUserId,
      subject_id: subjectCsId,
      name: 'Graph Algorithms (BFS/DFS/Dijkstra)',
      difficulty: 4,
      is_hard: true,
      estimated_hours: 3.5,
      key_concepts: ['Adjacency List', 'Topological Sort', 'Dijkstra Priority Queue', 'Cycle Detection'],
      summary: 'Traversal, shortest paths, and topological ordering on directed and undirected graphs.',
    },
    {
      id: 'top-cs-03',
      user_id: demoUserId,
      subject_id: subjectCsId,
      name: 'Binary Search Trees & AVL Balancing',
      difficulty: 3,
      is_hard: false,
      estimated_hours: 2.5,
      key_concepts: ['Inorder traversal', 'AVL balance factors', 'Rotations', 'Time complexity O(log N)'],
      summary: 'Self-balancing trees ensuring logarithmic lookup, insert, and delete operations.',
    },
    {
      id: 'top-hist-01',
      user_id: demoUserId,
      subject_id: subjectHistId,
      name: 'The Industrial Revolution & Global Impacts',
      difficulty: 2,
      is_hard: false,
      estimated_hours: 2.0,
      key_concepts: ['Steam engine', 'Urbanization', 'Labor movements', 'Textile mechanization'],
      summary: 'Socio-economic transition from agrarian craft economies to machine manufacturing.',
    },
    {
      id: 'top-hist-02',
      user_id: demoUserId,
      subject_id: subjectHistId,
      name: 'Cold War Geopolitics & Proxy Conflicts',
      difficulty: 3,
      is_hard: false,
      estimated_hours: 2.5,
      key_concepts: ['Containment Doctrine', 'Cuban Missile Crisis', 'MAD', 'Proxy wars (Korea, Vietnam)'],
      summary: 'Bipolar geopolitical tension between NATO and Warsaw Pact nations from 1947 to 1991.',
    },
  ];

  const examDate = getInitialDemoDate(14); // 2 weeks from now
  const initialExam: DBExamConfig = {
    id: 'exam-001',
    user_id: demoUserId,
    exam_title: 'Semester Finals & Comprehensive Board Exam',
    exam_date: examDate,
    daily_study_hours: 3.5,
    start_time: '09:00',
    target_score: '95%',
    updated_at: new Date().toISOString(),
  };

  const planId = 'plan-001';
  const initialPlan: DBStudyPlan = {
    id: planId,
    user_id: demoUserId,
    exam_title: initialExam.exam_title,
    exam_date: examDate,
    daily_study_hours: 3.5,
    start_time: '09:00',
    status: 'active',
    generated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    approved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  };

  // Seed yesterday (completed session), today (pending), and tomorrow
  const yesterday = getInitialDemoDate(-1);
  const today = getInitialDemoDate(0);
  const tomorrow = getInitialDemoDate(1);
  const dayAfter = getInitialDemoDate(2);

  const initialSessions: DBSession[] = [
    {
      id: 'sess-01',
      plan_id: planId,
      user_id: demoUserId,
      date: yesterday,
      start_time: '09:00',
      durationMinutes: 75,
      subject_id: subjectBioId,
      subject_name: 'AP Biology',
      subject_color: '#10B981',
      topic_id: 'top-bio-01',
      topic_name: 'Cellular Respiration & Chemiosmosis',
      is_hard: true,
      session_type: 'deep_dive',
      status: 'completed',
      completed_at: new Date(Date.now() - 22 * 3600000).toISOString(),
      notes: 'Focused on ATP Synthase proton gradient and complex IV inhibition.',
    },
    {
      id: 'sess-02',
      plan_id: planId,
      user_id: demoUserId,
      date: yesterday,
      start_time: '10:30',
      durationMinutes: 60,
      subject_id: subjectCsId,
      subject_name: 'Data Structures & Algorithms',
      subject_color: '#3B82F6',
      topic_id: 'top-cs-01',
      topic_name: 'Dynamic Programming Patterns',
      is_hard: true,
      session_type: 'practice_quiz',
      status: 'completed',
      completed_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      notes: 'Reviewed 0/1 Knapsack recurrence and 1D space optimization.',
    },
    {
      id: 'sess-03',
      plan_id: planId,
      user_id: demoUserId,
      date: yesterday,
      start_time: '14:00',
      durationMinutes: 45,
      subject_id: subjectHistId,
      subject_name: 'World History',
      subject_color: '#F59E0B',
      topic_id: 'top-hist-01',
      topic_name: 'The Industrial Revolution & Global Impacts',
      is_hard: false,
      session_type: 'flashcard_drill',
      status: 'missed',
      notes: 'Missed due to dental appointment.',
    },
    // Today
    {
      id: 'sess-04',
      plan_id: planId,
      user_id: demoUserId,
      date: today,
      start_time: '09:00',
      durationMinutes: 75,
      subject_id: subjectCsId,
      subject_name: 'Data Structures & Algorithms',
      subject_color: '#3B82F6',
      topic_id: 'top-cs-02',
      topic_name: 'Graph Algorithms (BFS/DFS/Dijkstra)',
      is_hard: true,
      session_type: 'deep_dive',
      status: 'pending',
    },
    {
      id: 'sess-05',
      plan_id: planId,
      user_id: demoUserId,
      date: today,
      start_time: '10:30',
      durationMinutes: 60,
      subject_id: subjectBioId,
      subject_name: 'AP Biology',
      subject_color: '#10B981',
      topic_id: 'top-bio-03',
      topic_name: 'Mendelian & Molecular Genetics',
      is_hard: true,
      session_type: 'study',
      status: 'pending',
    },
    {
      id: 'sess-06',
      plan_id: planId,
      user_id: demoUserId,
      date: today,
      start_time: '14:00',
      durationMinutes: 45,
      subject_id: subjectHistId,
      subject_name: 'World History',
      subject_color: '#F59E0B',
      topic_id: 'top-hist-02',
      topic_name: 'Cold War Geopolitics & Proxy Conflicts',
      is_hard: false,
      session_type: 'revision',
      status: 'pending',
    },
    // Tomorrow
    {
      id: 'sess-07',
      plan_id: planId,
      user_id: demoUserId,
      date: tomorrow,
      start_time: '09:00',
      durationMinutes: 75,
      subject_id: subjectBioId,
      subject_name: 'AP Biology',
      subject_color: '#10B981',
      topic_id: 'top-bio-02',
      topic_name: 'Photosynthesis & Calvin Cycle',
      is_hard: false,
      session_type: 'study',
      status: 'pending',
    },
    {
      id: 'sess-08',
      plan_id: planId,
      user_id: demoUserId,
      date: tomorrow,
      start_time: '10:30',
      durationMinutes: 60,
      subject_id: subjectCsId,
      subject_name: 'Data Structures & Algorithms',
      subject_color: '#3B82F6',
      topic_id: 'top-cs-03',
      topic_name: 'Binary Search Trees & AVL Balancing',
      is_hard: false,
      session_type: 'practice_quiz',
      status: 'pending',
    },
  ];

  const initialActivities: DBActivity[] = [
    {
      id: 'act-01',
      user_id: demoUserId,
      type: 'completed',
      title: 'Completed Session: Cellular Respiration',
      subtitle: '75 min deep dive with ATP synthase notes',
      timestamp: new Date(Date.now() - 22 * 3600000).toISOString(),
    },
    {
      id: 'act-02',
      user_id: demoUserId,
      type: 'completed',
      title: 'Completed Session: DP Patterns',
      subtitle: '60 min practice quiz on 0/1 knapsack',
      timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
    },
    {
      id: 'act-03',
      user_id: demoUserId,
      type: 'missed',
      title: 'Missed Session: Industrial Revolution',
      subtitle: 'Added to study backlog for rescheduling',
      timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
    },
  ];

  return {
    users: [
      {
        id: demoUserId,
        email: 'demo@studysync.ai',
        password_hash: hashedPw,
        full_name: 'Alex Rivera',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
    subjects: initialSubjects,
    files: initialFiles,
    topics: initialTopics,
    exam_configs: [initialExam],
    study_plans: [initialPlan],
    sessions: initialSessions,
    activities: initialActivities,
  };
}

export function getDB(): DBSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(data);
      return inMemoryDb!;
    } catch (e) {
      console.warn('Failed to parse DB_FILE, seeding fresh database:', e);
    }
  }

  inMemoryDb = createSeedData();
  saveDB();
  return inMemoryDb;
}

export function saveDB(): void {
  if (!inMemoryDb) return;
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`;
}
