import { WEEKDAY_SCHEDULE } from "../data/curriculum.ts";
import { DailyStudyLog, QuizQuestion, SavedExpression, StudyMode, UserProgress } from "../types.ts";

const LEGACY_STORAGE_KEY = "sprouteng_progress_v1";
const STORAGE_PREFIX = "sprouteng_progress_clean_v2_";
const AUTH_SESSION_KEY = "sprouteng_auth_session_v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface AuthSession {
  username: string;
  token: string;
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.username || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function formatDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildEmptySevenDaysLogs(): DailyStudyLog[] {
  const logs: DailyStudyLog[] = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset--) {
    const dt = new Date(now.getTime() - offset * ONE_DAY_MS);
    const dateKey = formatDateKey(dt);
    const schedule = WEEKDAY_SCHEDULE.find((w) => w.jsDay === dt.getDay());
    logs.push({
      date: dateKey,
      weekdayLabel: schedule?.shortLabel ?? "월",
      grammarCount: 0,
      writingCount: 0,
      conversationTurns: 0,
      quizCorrect: 0,
      quizTotal: 0,
      xpEarned: 0,
    });
  }
  return logs;
}

export function createEmptyProgress(): UserProgress {
  return {
    xp: 0,
    streakDays: 0,
    lastStudyDate: "",
    completedGrammarIds: [],
    completedWritingIds: [],
    conversationTurnsTotal: 0,
    quizCorrectTotal: 0,
    quizAttemptTotal: 0,
    srsRecoveredTotal: 0,
    dailyQuizCompletedDates: [],
    savedExpressions: [],
    srsQueue: [],
    studyLogs: buildEmptySevenDaysLogs(),
  };
}

export function loadProgress(username: string): UserProgress {
  if (typeof window === "undefined") return createEmptyProgress();
  try {
    // Clean up legacy seeded data so no stale records remain
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    const key = `${STORAGE_PREFIX}${username}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const fresh = createEmptyProgress();
      window.localStorage.setItem(key, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as UserProgress;
    if (!parsed || !Array.isArray(parsed.studyLogs)) {
      return createEmptyProgress();
    }
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(username: string, progress: UserProgress): void {
  if (typeof window === "undefined" || !username) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(progress));
  } catch {
    // ignore storage quota error
  }
}

export function resetProgressForUser(username: string): UserProgress {
  const fresh = createEmptyProgress();
  saveProgress(username, fresh);
  return fresh;
}

function ensureTodayLog(logs: DailyStudyLog[]): DailyStudyLog[] {
  const todayKey = formatDateKey(new Date());
  const existingIdx = logs.findIndex((l) => l.date === todayKey);
  if (existingIdx >= 0) return logs.map((l) => ({ ...l }));
  const schedule = WEEKDAY_SCHEDULE.find((w) => w.jsDay === new Date().getDay());
  return [
    ...logs.slice(-6),
    {
      date: todayKey,
      weekdayLabel: schedule?.shortLabel ?? "월",
      grammarCount: 0,
      writingCount: 0,
      conversationTurns: 0,
      quizCorrect: 0,
      quizTotal: 0,
      xpEarned: 0,
    },
  ];
}

export function recordActivity(
  prev: UserProgress,
  update: {
    xpDelta: number;
    grammarId?: string;
    writingId?: string;
    conversationTurnDelta?: number;
    quizCorrectDelta?: number;
    quizAttemptDelta?: number;
    markDailyQuizDone?: boolean;
  }
): UserProgress {
  const todayKey = formatDateKey(new Date());
  const logs = ensureTodayLog(prev.studyLogs);
  const todayLog = logs[logs.length - 1];

  if (update.grammarId) {
    todayLog.grammarCount += 1;
  }
  if (update.writingId) {
    todayLog.writingCount += 1;
  }
  if (update.conversationTurnDelta) {
    todayLog.conversationTurns += update.conversationTurnDelta;
  }
  if (update.quizCorrectDelta) {
    todayLog.quizCorrect += update.quizCorrectDelta;
  }
  if (update.quizAttemptDelta) {
    todayLog.quizTotal += update.quizAttemptDelta;
  }
  todayLog.xpEarned += update.xpDelta;

  const isNewDay = prev.lastStudyDate !== todayKey;
  const completedGrammarIds =
    update.grammarId && !prev.completedGrammarIds.includes(update.grammarId)
      ? [...prev.completedGrammarIds, update.grammarId]
      : prev.completedGrammarIds;
  const completedWritingIds =
    update.writingId && !prev.completedWritingIds.includes(update.writingId)
      ? [...prev.completedWritingIds, update.writingId]
      : prev.completedWritingIds;

  const dailyQuizCompletedDates =
    update.markDailyQuizDone && !prev.dailyQuizCompletedDates.includes(todayKey)
      ? [...prev.dailyQuizCompletedDates, todayKey]
      : prev.dailyQuizCompletedDates;

  return {
    ...prev,
    xp: prev.xp + update.xpDelta,
    streakDays: isNewDay ? prev.streakDays + 1 : prev.streakDays,
    lastStudyDate: todayKey,
    completedGrammarIds,
    completedWritingIds,
    conversationTurnsTotal: prev.conversationTurnsTotal + (update.conversationTurnDelta ?? 0),
    quizCorrectTotal: prev.quizCorrectTotal + (update.quizCorrectDelta ?? 0),
    quizAttemptTotal: prev.quizAttemptTotal + (update.quizAttemptDelta ?? 0),
    dailyQuizCompletedDates,
    studyLogs: logs,
  };
}

export function addWrongQuestionToSrs(prev: UserProgress, question: QuizQuestion): UserProgress {
  const now = Date.now();
  const existingIdx = prev.srsQueue.findIndex((c) => c.id === question.id);
  const nextQueue = [...prev.srsQueue];

  if (existingIdx >= 0) {
    const existing = nextQueue[existingIdx];
    nextQueue[existingIdx] = {
      ...existing,
      wrongCount: existing.wrongCount + 1,
      intervalDays: 1,
      nextReviewAt: now + ONE_DAY_MS,
      lastReviewedAt: now,
      mastered: false,
    };
  } else {
    nextQueue.unshift({
      id: question.id,
      question,
      wrongCount: 1,
      intervalDays: 1,
      nextReviewAt: now + ONE_DAY_MS,
      lastReviewedAt: now,
      mastered: false,
    });
  }

  return {
    ...prev,
    srsQueue: nextQueue,
  };
}

export function resolveSrsReview(prev: UserProgress, cardId: string, isCorrect: boolean): UserProgress {
  const now = Date.now();
  const nextIntervals = [1, 3, 7, 14];
  let recoveredDelta = 0;

  const nextQueue = prev.srsQueue.map((card) => {
    if (card.id !== cardId) return card;
    if (!isCorrect) {
      return {
        ...card,
        wrongCount: card.wrongCount + 1,
        intervalDays: 1,
        nextReviewAt: now + ONE_DAY_MS,
        lastReviewedAt: now,
        mastered: false,
      };
    }

    const currentIndex = nextIntervals.indexOf(card.intervalDays);
    if (currentIndex === -1 || currentIndex === nextIntervals.length - 1) {
      recoveredDelta = 1;
      return {
        ...card,
        lastReviewedAt: now,
        mastered: true,
      };
    }

    const nextDays = nextIntervals[currentIndex + 1];
    recoveredDelta = 1;
    return {
      ...card,
      intervalDays: nextDays,
      nextReviewAt: now + nextDays * ONE_DAY_MS,
      lastReviewedAt: now,
      mastered: false,
    };
  });

  const withXp = recordActivity(prev, {
    xpDelta: isCorrect ? 20 : 5,
    quizCorrectDelta: isCorrect ? 1 : 0,
    quizAttemptDelta: 1,
  });

  return {
    ...withXp,
    srsRecoveredTotal: prev.srsRecoveredTotal + recoveredDelta,
    srsQueue: nextQueue,
  };
}

export function shiftSrsScheduleDays(prev: UserProgress, days: number): UserProgress {
  const deltaMs = days * ONE_DAY_MS;
  return {
    ...prev,
    srsQueue: prev.srsQueue.map((card) => ({
      ...card,
      nextReviewAt: card.nextReviewAt - deltaMs,
    })),
  };
}

export function toggleSavedExpression(
  prev: UserProgress,
  item: { en: string; ko: string; category: StudyMode }
): UserProgress {
  const exists = prev.savedExpressions.some(
    (s) => s.en.toLowerCase() === item.en.trim().toLowerCase()
  );
  if (exists) {
    return {
      ...prev,
      savedExpressions: prev.savedExpressions.filter(
        (s) => s.en.toLowerCase() !== item.en.trim().toLowerCase()
      ),
    };
  }
  const newItem: SavedExpression = {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    en: item.en.trim(),
    ko: item.ko.trim(),
    category: item.category,
    savedAt: Date.now(),
  };
  return {
    ...prev,
    savedExpressions: [newItem, ...prev.savedExpressions],
  };
}

export function exportProgressToJson(username: string, progress: UserProgress): string {
  return JSON.stringify(
    {
      app: "SproutEng",
      version: 1,
      username,
      exportedAt: new Date().toISOString(),
      progress,
    },
    null,
    2
  );
}

export function parseImportedProgressJson(rawText: string): UserProgress {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("올바른 JSON 파일 형식이 아닙니다.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("학습 기록 데이터를 읽을 수 없습니다.");
  }

  const candidate =
    "progress" in parsed && (parsed as { progress?: unknown }).progress
      ? (parsed as { progress: unknown }).progress
      : parsed;

  if (!candidate || typeof candidate !== "object") {
    throw new Error("SproutEng 학습 기록 파일이 아닙니다.");
  }

  const data = candidate as Partial<UserProgress>;
  if (
    typeof data.xp !== "number" ||
    !Array.isArray(data.studyLogs) ||
    !Array.isArray(data.savedExpressions) ||
    !Array.isArray(data.srsQueue)
  ) {
    throw new Error("필수 학습 기록 필드가 누락된 파일입니다.");
  }

  return {
    xp: Math.max(0, Math.floor(data.xp)),
    streakDays: typeof data.streakDays === "number" ? Math.max(0, Math.floor(data.streakDays)) : 0,
    lastStudyDate: typeof data.lastStudyDate === "string" ? data.lastStudyDate : "",
    completedGrammarIds: Array.isArray(data.completedGrammarIds) ? data.completedGrammarIds : [],
    completedWritingIds: Array.isArray(data.completedWritingIds) ? data.completedWritingIds : [],
    conversationTurnsTotal:
      typeof data.conversationTurnsTotal === "number" ? Math.max(0, data.conversationTurnsTotal) : 0,
    quizCorrectTotal:
      typeof data.quizCorrectTotal === "number" ? Math.max(0, data.quizCorrectTotal) : 0,
    quizAttemptTotal:
      typeof data.quizAttemptTotal === "number" ? Math.max(0, data.quizAttemptTotal) : 0,
    srsRecoveredTotal:
      typeof data.srsRecoveredTotal === "number" ? Math.max(0, data.srsRecoveredTotal) : 0,
    dailyQuizCompletedDates: Array.isArray(data.dailyQuizCompletedDates)
      ? data.dailyQuizCompletedDates
      : [],
    savedExpressions: data.savedExpressions,
    srsQueue: data.srsQueue,
    studyLogs: data.studyLogs.length > 0 ? data.studyLogs : buildEmptySevenDaysLogs(),
  };
}

