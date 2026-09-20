import { DBSubject, DBTopic, DBSession, DBStudyPlan, generateId } from './db.js';

export interface GeneratePlanOptions {
  userId: string;
  examTitle: string;
  examDate: string; // YYYY-MM-DD
  dailyStudyHours: number;
  startTime: string; // HH:MM
  subjects: DBSubject[];
  topics: DBTopic[];
  existingPlanId?: string;
}

export function buildAdaptivePlan(options: GeneratePlanOptions): {
  plan: DBStudyPlan;
  sessions: DBSession[];
} {
  const {
    userId,
    examTitle,
    examDate,
    dailyStudyHours,
    startTime = '09:00',
    subjects,
    topics,
  } = options;

  const planId = options.existingPlanId || generateId('plan');

  // Calculate days between today and examDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examD = new Date(examDate);
  examD.setHours(0, 0, 0, 0);

  let diffDays = Math.round((examD.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 0) diffDays = 7; // fallback at least 7 days
  // Cap at 90 days for reasonable preview
  const totalDays = Math.min(diffDays, 90);

  // Subject lookup map
  const subjectMap = new Map<string, DBSubject>();
  subjects.forEach(s => subjectMap.set(s.id, s));

  // Sort topics: Hard topics get higher priority
  // Also prepare topic study units
  interface StudyUnit {
    topic: DBTopic;
    subject: DBSubject;
    isHard: boolean;
    durationMinutes: number;
    sessionType: 'study' | 'deep_dive' | 'practice_quiz' | 'flashcard_drill';
  }

  const studyUnits: StudyUnit[] = [];

  for (const topic of topics) {
    const subj = subjectMap.get(topic.subject_id) || {
      id: topic.subject_id,
      user_id: userId,
      name: 'General',
      color: '#6366F1',
      created_at: new Date().toISOString(),
    };

    // Hard topics get deep dive session + extra practice drill
    if (topic.is_hard || topic.difficulty >= 4) {
      studyUnits.push({
        topic,
        subject: subj,
        isHard: true,
        durationMinutes: 75,
        sessionType: 'deep_dive',
      });
      studyUnits.push({
        topic,
        subject: subj,
        isHard: true,
        durationMinutes: 60,
        sessionType: 'practice_quiz',
      });
    } else {
      studyUnits.push({
        topic,
        subject: subj,
        isHard: false,
        durationMinutes: 50,
        sessionType: 'study',
      });
      if (topic.difficulty >= 3) {
        studyUnits.push({
          topic,
          subject: subj,
          isHard: false,
          durationMinutes: 45,
          sessionType: 'flashcard_drill',
        });
      }
    }
  }

  // Interleave subjects so students don't get consecutive blocks of the exact same subject
  // Group study units by subject
  const bySubject: Record<string, StudyUnit[]> = {};
  for (const unit of studyUnits) {
    if (!bySubject[unit.subject.id]) bySubject[unit.subject.id] = [];
    bySubject[unit.subject.id].push(unit);
  }

  const subjectIds = Object.keys(bySubject);
  const interleavedUnits: StudyUnit[] = [];
  let added = true;
  let cycle = 0;

  while (added) {
    added = false;
    for (const sid of subjectIds) {
      if (bySubject[sid].length > 0) {
        interleavedUnits.push(bySubject[sid].shift()!);
        added = true;
      }
    }
    cycle++;
    if (cycle > 500) break;
  }

  const dailyMinutesAvailable = Math.round(dailyStudyHours * 60);
  const sessions: DBSession[] = [];
  let unitIndex = 0;

  // Generate sessions across the days
  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const curDate = new Date(today.getTime() + dayIdx * 86400000);
    const dateStr = curDate.toISOString().split('T')[0];

    const isFinalRevisionDay = dayIdx >= totalDays - 2; // Last 2 days before exam are comprehensive revision
    let minutesUsed = 0;
    let currentStartMinutes = parseTimeToMinutes(startTime);

    if (isFinalRevisionDay) {
      // Final comprehensive revision sessions across subjects
      for (const subj of subjects) {
        if (minutesUsed + 45 > dailyMinutesAvailable) break;
        const startStr = minutesToTimeString(currentStartMinutes);
        sessions.push({
          id: generateId('sess'),
          plan_id: planId,
          user_id: userId,
          date: dateStr,
          start_time: startStr,
          durationMinutes: 50,
          subject_id: subj.id,
          subject_name: subj.name,
          subject_color: subj.color,
          topic_name: `Comprehensive Final Revision: ${subj.name}`,
          is_hard: false,
          session_type: 'revision',
          status: 'pending',
        });
        minutesUsed += 50;
        currentStartMinutes += 60; // 50m session + 10m break
      }
      continue;
    }

    // Every 5th day, add an active recall spaced-repetition checkpoint
    if (dayIdx > 0 && dayIdx % 4 === 0) {
      const revSubj = subjects[dayIdx % subjects.length] || subjects[0];
      if (revSubj) {
        const startStr = minutesToTimeString(currentStartMinutes);
        sessions.push({
          id: generateId('sess'),
          plan_id: planId,
          user_id: userId,
          date: dateStr,
          start_time: startStr,
          durationMinutes: 45,
          subject_id: revSubj.id,
          subject_name: revSubj.name,
          subject_color: revSubj.color,
          topic_name: `Cumulative Spaced Revision (${revSubj.name})`,
          is_hard: false,
          session_type: 'revision',
          status: 'pending',
        });
        minutesUsed += 45;
        currentStartMinutes += 55;
      }
    }

    // Fill the day with interleaved units
    while (minutesUsed < dailyMinutesAvailable && unitIndex < interleavedUnits.length) {
      const unit = interleavedUnits[unitIndex];
      if (minutesUsed + unit.durationMinutes > dailyMinutesAvailable + 15 && minutesUsed > 0) {
        break; // save for next day
      }

      const startStr = minutesToTimeString(currentStartMinutes);
      sessions.push({
        id: generateId('sess'),
        plan_id: planId,
        user_id: userId,
        date: dateStr,
        start_time: startStr,
        durationMinutes: unit.durationMinutes,
        subject_id: unit.subject.id,
        subject_name: unit.subject.name,
        subject_color: unit.subject.color,
        topic_id: unit.topic.id,
        topic_name: unit.topic.name,
        is_hard: unit.isHard,
        session_type: unit.sessionType,
        status: 'pending',
      });

      minutesUsed += unit.durationMinutes;
      currentStartMinutes += unit.durationMinutes + 10; // 10 min break
      unitIndex++;
    }

    // If all initial units finished, add reinforcement flashcard/quiz sessions
    if (unitIndex >= interleavedUnits.length && minutesUsed + 45 <= dailyMinutesAvailable) {
      const randomSubj = subjects[dayIdx % subjects.length] || subjects[0];
      if (randomSubj) {
        const startStr = minutesToTimeString(currentStartMinutes);
        sessions.push({
          id: generateId('sess'),
          plan_id: planId,
          user_id: userId,
          date: dateStr,
          start_time: startStr,
          durationMinutes: 45,
          subject_id: randomSubj.id,
          subject_name: randomSubj.name,
          subject_color: randomSubj.color,
          topic_name: `Reinforcement Drill: ${randomSubj.name}`,
          is_hard: false,
          session_type: 'flashcard_drill',
          status: 'pending',
        });
        minutesUsed += 45;
      }
    }
  }

  const plan: DBStudyPlan = {
    id: planId,
    user_id: userId,
    exam_title: examTitle,
    exam_date: examDate,
    daily_study_hours: dailyStudyHours,
    start_time: startTime,
    status: 'draft',
    generated_at: new Date().toISOString(),
  };

  return { plan, sessions };
}

export function rescheduleMissedSessions(
  allSessions: DBSession[],
  missedSessionIds: string[],
  dailyStudyHours: number,
  startTime: string = '09:00'
): { updatedSessions: DBSession[]; rescheduledCount: number } {
  const todayStr = new Date().toISOString().split('T')[0];

  // Identify missed sessions
  const missedList = allSessions.filter(s =>
    missedSessionIds.includes(s.id) || (s.status === 'missed' && s.date <= todayStr)
  );

  if (missedList.length === 0) {
    return { updatedSessions: allSessions, rescheduledCount: 0 };
  }

  // Find future days (from tomorrow onward) that have room
  const dailyMinutesTarget = Math.round(dailyStudyHours * 60);

  // Group future pending sessions by date
  const futureSessionsByDate = new Map<string, DBSession[]>();
  for (const s of allSessions) {
    if (s.date >= todayStr && s.status === 'pending') {
      if (!futureSessionsByDate.has(s.date)) {
        futureSessionsByDate.set(s.date, []);
      }
      futureSessionsByDate.get(s.date)!.push(s);
    }
  }

  // Sort dates
  const futureDates = Array.from(futureSessionsByDate.keys()).sort();

  const newRescheduledSessions: DBSession[] = [];
  const handledIds = new Set<string>();

  for (const missed of missedList) {
    // Mark original as rescheduled
    missed.status = 'rescheduled';
    handledIds.add(missed.id);

    // Look for a future date with capacity, or push to the latest date
    let assignedDate = futureDates[0] || todayStr;
    for (const d of futureDates) {
      const daySessions = futureSessionsByDate.get(d) || [];
      const usedMin = daySessions.reduce((acc, cur) => acc + (cur.duration_minutes || cur.durationMinutes || 45), 0);
      if (usedMin + 45 <= dailyMinutesTarget + 20) {
        assignedDate = d;
        break;
      }
    }

    const daySessions = futureSessionsByDate.get(assignedDate) || [];
    const latestTime = daySessions.length > 0
      ? daySessions[daySessions.length - 1].start_time
      : startTime;
    const nextStartMinutes = parseTimeToMinutes(latestTime) + 60;
    const dur = Math.min(missed.duration_minutes || missed.durationMinutes || 45, 60);

    const rescheduledSession: DBSession = {
      id: generateId('sess'),
      plan_id: missed.plan_id,
      user_id: missed.user_id,
      date: assignedDate,
      start_time: minutesToTimeString(nextStartMinutes),
      duration_minutes: dur,
      durationMinutes: dur,
      subject_id: missed.subject_id,
      subject_name: missed.subject_name,
      subject_color: missed.subject_color,
      topic_id: missed.topic_id,
      topic_name: `[Rescheduled] ${missed.topic_name}`,
      is_hard: missed.is_hard,
      session_type: 'revision',
      status: 'pending',
      notes: `Rescheduled from ${missed.date}`,
    };

    newRescheduledSessions.push(rescheduledSession);
    if (!futureSessionsByDate.has(assignedDate)) {
      futureSessionsByDate.set(assignedDate, []);
    }
    futureSessionsByDate.get(assignedDate)!.push(rescheduledSession);
  }

  const updatedSessions = allSessions
    .map(s => {
      const match = missedList.find(m => m.id === s.id);
      return match ? { ...s, status: 'rescheduled' as const } : s;
    })
    .concat(newRescheduledSessions);

  return {
    updatedSessions,
    rescheduledCount: newRescheduledSessions.length,
  };
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 9 * 60;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 9) * 60 + (m || 0);
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
