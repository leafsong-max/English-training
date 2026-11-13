export type StudyMode = "grammar" | "writing" | "conversation";

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type MainTab = "study" | "quiz" | "corrector" | "stats";

export interface GrammarLesson {
  id: string;
  titleKo: string;
  subtitleKo: string;
  ruleSummaryKo: string;
  incorrectExample: string;
  correctExample: string;
  tipKo: string;
  drillPromptKo: string;
  sampleAnswerEn: string;
}

export interface WritingPrompt {
  id: string;
  titleKo: string;
  koreanPrompt: string;
  levelLabel: string;
  hintWords: string[];
  modelAnswerEn: string;
}

export interface ConversationScenario {
  id: string;
  titleKo: string;
  subtitleKo: string;
  contextEn: string;
  openingEn: string;
  openingKo: string;
  keyExpressions: Array<{ en: string; ko: string }>;
  starterReplies: string[];
}

export interface DailySentence {
  id: string;
  date: string;
  track: StudyMode;
  en: string;
  ko: string;
  nuanceKo: string;
  keyExpression: string;
}

export interface QuizQuestion {
  id: string;
  track: StudyMode;
  questionKo: string;
  promptEn: string;
  options: string[];
  correctIndex: number;
  explanationKo: string;
  keySentenceEn: string;
  keySentenceKo: string;
}

export interface SrsCard {
  id: string;
  question: QuizQuestion;
  wrongCount: number;
  intervalDays: number;
  nextReviewAt: number;
  lastReviewedAt: number;
  mastered: boolean;
}

export interface CorrectionErrorHighlight {
  original: string;
  corrected: string;
  reasonKo: string;
}

export interface NaturalAlternative {
  tone: string;
  expression: string;
  meaningKo: string;
}

export interface CorrectionResult {
  isNatural: boolean;
  correctedSentence: string;
  accuracyScore: number;
  errorHighlights: CorrectionErrorHighlight[];
  explanationKo: string;
  naturalAlternatives: NaturalAlternative[];
  keyTakeawayKo: string;
}

export interface SavedExpression {
  id: string;
  en: string;
  ko: string;
  category: StudyMode;
  savedAt: number;
}

export interface DailyStudyLog {
  date: string;
  weekdayLabel: string;
  grammarCount: number;
  writingCount: number;
  conversationTurns: number;
  quizCorrect: number;
  quizTotal: number;
  xpEarned: number;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  textEn: string;
  textKo?: string;
  coaching?: {
    isNatural: boolean;
    betterExpression: string;
    feedbackKo: string;
  };
}

export interface PlantStage {
  level: number;
  nameKo: string;
  englishName: string;
  minXp: number;
  maxXp: number;
  messageKo: string;
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastStudyDate: string;
  completedGrammarIds: string[];
  completedWritingIds: string[];
  conversationTurnsTotal: number;
  quizCorrectTotal: number;
  quizAttemptTotal: number;
  srsRecoveredTotal: number;
  dailyQuizCompletedDates: string[];
  savedExpressions: SavedExpression[];
  srsQueue: SrsCard[];
  studyLogs: DailyStudyLog[];
}
