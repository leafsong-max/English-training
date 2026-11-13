import { useEffect, useState } from "react";
import { BarChart3, BookOpenCheck, HelpCircle, LogOut, Sparkles } from "lucide-react";
import { CorrectorStudioTab } from "./components/CorrectorStudioTab.tsx";
import { LoginGate } from "./components/LoginGate.tsx";
import { QuizAndSrsTab } from "./components/QuizAndSrsTab.tsx";
import { StatsDashboardTab } from "./components/StatsDashboardTab.tsx";
import { StudyTab } from "./components/StudyTab.tsx";
import { getPlantStage } from "./data/curriculum.ts";
import { MainTab, QuizQuestion, StudyMode, UserProgress } from "./types.ts";
import { verifySessionToken } from "./utils/api.ts";
import {
  AuthSession,
  addWrongQuestionToSrs,
  clearAuthSession,
  createEmptyProgress,
  loadAuthSession,
  loadProgress,
  recordActivity,
  resetProgressForUser,
  resolveSrsReview,
  saveAuthSession,
  saveProgress,
  shiftSrsScheduleDays,
  toggleSavedExpression,
} from "./utils/storage.ts";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [checkingAuth, setCheckingAuth] = useState<boolean>(() => Boolean(loadAuthSession()));
  const [activeTab, setActiveTab] = useState<MainTab>("study");
  const [progress, setProgress] = useState<UserProgress>(() => {
    const existing = loadAuthSession();
    return existing ? loadProgress(existing.username) : createEmptyProgress();
  });

  useEffect(() => {
    let active = true;
    const saved = loadAuthSession();
    if (!saved) {
      setCheckingAuth(false);
      return;
    }
    void verifySessionToken(saved.token).then((res) => {
      if (!active) return;
      if (!res.valid || !res.username) {
        clearAuthSession();
        setSession(null);
      } else {
        setProgress(loadProgress(res.username));
      }
      setCheckingAuth(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session?.username) {
      saveProgress(session.username, progress);
    }
  }, [session?.username, progress]);

  const handleLoginSuccess = (newSession: AuthSession) => {
    saveAuthSession(newSession);
    setSession(newSession);
    setProgress(loadProgress(newSession.username));
    setActiveTab("study");
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setProgress(createEmptyProgress());
  };

  const handleResetProgress = () => {
    if (!session?.username) return;
    setProgress(resetProgressForUser(session.username));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center text-sm text-[#526058]">
        계정 세션을 확인하는 중입니다...
      </div>
    );
  }

  if (!session) {
    return <LoginGate onSuccess={handleLoginSuccess} />;
  }

  const dueSrsCount = progress.srsQueue.filter(
    (c) => !c.mastered && c.nextReviewAt <= Date.now()
  ).length;
  const plantInfo = getPlantStage(progress.xp);

  const handleCompleteGrammar = (lessonId: string) => {
    setProgress((prev) =>
      recordActivity(prev, {
        xpDelta: 25,
        grammarId: lessonId,
      })
    );
  };

  const handleCompleteWriting = (promptId: string) => {
    setProgress((prev) =>
      recordActivity(prev, {
        xpDelta: 30,
        writingId: promptId,
      })
    );
  };

  const handleConversationTurn = () => {
    setProgress((prev) =>
      recordActivity(prev, {
        xpDelta: 15,
        conversationTurnDelta: 1,
      })
    );
  };

  const handleRecordCorrectionXp = (xpDelta: number) => {
    setProgress((prev) =>
      recordActivity(prev, {
        xpDelta,
      })
    );
  };

  const handleQuizAnswer = (question: QuizQuestion, isCorrect: boolean) => {
    setProgress((prev) => {
      const updated = recordActivity(prev, {
        xpDelta: isCorrect ? 15 : 5,
        quizCorrectDelta: isCorrect ? 1 : 0,
        quizAttemptDelta: 1,
        markDailyQuizDone: true,
      });
      return isCorrect ? updated : addWrongQuestionToSrs(updated, question);
    });
  };

  const handleResolveSrs = (cardId: string, isCorrect: boolean) => {
    setProgress((prev) => resolveSrsReview(prev, cardId, isCorrect));
  };

  const handleShiftSrsDays = (days: number) => {
    setProgress((prev) => shiftSrsScheduleDays(prev, days));
  };

  const handleToggleSave = (en: string, ko: string, category: StudyMode) => {
    setProgress((prev) => toggleSavedExpression(prev, { en, ko, category }));
  };

  const navItems: Array<{
    id: MainTab;
    label: string;
    icon: typeof BookOpenCheck;
    badgeCount?: number;
  }> = [
    { id: "study", label: "요일별 학습", icon: BookOpenCheck },
    { id: "quiz", label: "퀴즈·복습", icon: HelpCircle, badgeCount: dueSrsCount },
    { id: "corrector", label: "실시간 교정", icon: Sparkles },
    { id: "stats", label: "성장 통계", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#14211A] flex flex-col">
      {/* Top Bar: Clean 3-zone layout, compact height */}
      <header className="sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-[#E5E8E3]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("study")}
            className="text-lg font-bold tracking-tight text-[#14211A] whitespace-nowrap shrink-0"
          >
            SproutEng
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#526058]">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? "text-[#14211A] font-semibold border-emerald-700"
                      : "border-transparent hover:text-[#14211A]"
                  }`}
                >
                  {item.label}
                  {item.badgeCount ? ` (${item.badgeCount})` : ""}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className="min-h-[36px] px-3 rounded-xl bg-[#14211A] hover:bg-[#23382C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
            >
              {session.username} · Lv.{plantInfo.current.level}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="로그아웃"
              title="로그아웃"
              className="min-h-[36px] min-w-[36px] px-2.5 rounded-xl border border-[#DCE1DA] bg-white hover:bg-[#F4F6F3] text-xs font-medium text-[#526058] hover:text-[#14211A] inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        key={session.username}
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12"
      >
        {activeTab === "study" && (
          <StudyTab
            progress={progress}
            onCompleteGrammar={handleCompleteGrammar}
            onCompleteWriting={handleCompleteWriting}
            onConversationTurn={handleConversationTurn}
            onToggleSave={handleToggleSave}
            onInspectGrowth={() => setActiveTab("stats")}
          />
        )}

        {activeTab === "quiz" && (
          <QuizAndSrsTab
            progress={progress}
            onQuizAnswer={handleQuizAnswer}
            onResolveSrs={handleResolveSrs}
            onShiftSrsDays={handleShiftSrsDays}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeTab === "corrector" && (
          <CorrectorStudioTab
            savedExpressions={progress.savedExpressions}
            onToggleSave={handleToggleSave}
            onRecordCorrectionXp={handleRecordCorrectionXp}
          />
        )}

        {activeTab === "stats" && (
          <StatsDashboardTab
            username={session.username}
            progress={progress}
            onToggleSave={handleToggleSave}
            onImportProgress={(imported) => setProgress(imported)}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (44px+ touch targets, thumb zone) */}
      <nav
        aria-label="하단 주 메뉴"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E5E8E3] grid grid-cols-4 items-center px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors ${
                active ? "text-emerald-700" : "text-[#526058]"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono tabular-nums font-bold flex items-center justify-center">
                    {item.badgeCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
