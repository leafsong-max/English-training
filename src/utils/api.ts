import { CorrectionResult, QuizQuestion, StudyMode } from "../types.ts";
import { loadAuthSession } from "./storage.ts";

function getAuthHeaders(): Record<string, string> {
  const session = loadAuthSession();
  return session?.token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      }
    : { "Content-Type": "application/json" };
}

export async function loginAccount(
  username: string,
  password: string
): Promise<{ token: string; username: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "로그인에 실패했습니다.");
  }
  return data as { token: string; username: string };
}

export async function verifySessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const res = await fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { valid: false };
    return (await res.json()) as { valid: boolean; username?: string };
  } catch {
    return { valid: false };
  }
}

export async function requestSentenceCorrection(params: {
  text: string;
  contextType?: StudyMode | "general";
  targetPrompt?: string;
}): Promise<CorrectionResult> {
  const res = await fetch("/api/correct", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "문장 교정 요청에 실패했습니다.");
  }
  return data as CorrectionResult;
}

export async function requestDailyQuizFromAi(track: StudyMode): Promise<{
  dailySentence: {
    en: string;
    ko: string;
    nuanceKo: string;
    keyExpression: string;
  };
  questions: QuizQuestion[];
}> {
  const res = await fetch("/api/daily-quiz", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ track, level: "intermediate" }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "새 퀴즈 생성에 실패했습니다.");
  }

  const questions: QuizQuestion[] = (data.questions || []).map(
    (q: Omit<QuizQuestion, "id" | "track">, index: number) => ({
      ...q,
      id: `ai-q-${Date.now()}-${index}`,
      track,
    })
  );

  return {
    dailySentence: data.dailySentence,
    questions,
  };
}

export async function requestConversationTurn(params: {
  scenarioTitle: string;
  scenarioContext: string;
  history: Array<{ role: "assistant" | "user"; text: string }>;
  userMessage: string;
}): Promise<{
  replyEn: string;
  replyKo: string;
  coaching: {
    isNatural: boolean;
    betterExpression: string;
    feedbackKo: string;
  };
  suggestedReplies: string[];
}> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "회화 응답을 받아오지 못했습니다.");
  }
  return data;
}
