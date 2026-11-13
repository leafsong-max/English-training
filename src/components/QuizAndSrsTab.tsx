import { useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
  FastForward,
  Loader2,
  RefreshCw,
  RotateCcw,
  Volume2,
} from "lucide-react";
import {
  DAILY_SENTENCES_BANK,
  DEFAULT_QUIZ_QUESTIONS,
  getTodayWeekdayItem,
} from "../data/curriculum.ts";
import { QuizQuestion, SrsCard, StudyMode, UserProgress } from "../types.ts";
import { requestDailyQuizFromAi } from "../utils/api.ts";
import { speakEnglish } from "../utils/speech.ts";

interface QuizAndSrsTabProps {
  progress: UserProgress;
  onQuizAnswer: (question: QuizQuestion, isCorrect: boolean) => void;
  onResolveSrs: (cardId: string, isCorrect: boolean) => void;
  onShiftSrsDays: (days: number) => void;
  onToggleSave: (en: string, ko: string, category: StudyMode) => void;
}

function formatDueText(nextReviewAt: number, now: number): string {
  const diffMs = nextReviewAt - now;
  if (diffMs <= 0) return "지금 복습 가능";
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간 후 복습`;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${days}일 후 복습 예정`;
}

export function QuizAndSrsTab({
  progress,
  onQuizAnswer,
  onResolveSrs,
  onShiftSrsDays,
  onToggleSave,
}: QuizAndSrsTabProps) {
  const todayItem = getTodayWeekdayItem();
  const [subView, setSubView] = useState<"daily" | "srs">("daily");
  const [quizTrack, setQuizTrack] = useState<StudyMode>(todayItem.mode);

  // Daily sentence + quiz state
  const dayIndex = new Date().getDate() % DAILY_SENTENCES_BANK.length;
  const [dailySentence, setDailySentence] = useState(DAILY_SENTENCES_BANK[dayIndex]);
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ_QUESTIONS.slice(0, 3));
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loadingAiQuiz, setLoadingAiQuiz] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // SRS interactive state
  const [srsSelections, setSrsSelections] = useState<Record<string, number>>({});
  const [nowTick, setNowTick] = useState(() => Date.now());

  const dueCards = progress.srsQueue.filter((c) => !c.mastered && c.nextReviewAt <= nowTick);
  const upcomingCards = progress.srsQueue.filter((c) => !c.mastered && c.nextReviewAt > nowTick);
  const masteredCount = progress.srsQueue.filter((c) => c.mastered).length;

  const isSaved = (en: string) =>
    progress.savedExpressions.some((s) => s.en.toLowerCase() === en.trim().toLowerCase());

  const handleGenerateAiQuiz = async () => {
    setLoadingAiQuiz(true);
    setAiError(null);
    try {
      const data = await requestDailyQuizFromAi(quizTrack);
      setDailySentence({
        id: `ai-ds-${Date.now()}`,
        date: "today",
        track: quizTrack,
        en: data.dailySentence.en,
        ko: data.dailySentence.ko,
        nuanceKo: data.dailySentence.nuanceKo,
        keyExpression: data.dailySentence.keyExpression,
      });
      if (data.questions.length > 0) {
        setQuestions(data.questions);
        setSelectedAnswers({});
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "새 퀴즈를 불러오지 못했습니다.");
    } finally {
      setLoadingAiQuiz(false);
    }
  };

  const handlePickDailyOption = (q: QuizQuestion, optIdx: number) => {
    if (selectedAnswers[q.id] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    const isCorrect = optIdx === q.correctIndex;
    onQuizAnswer(q, isCorrect);
  };

  const handlePickSrsOption = (card: SrsCard, optIdx: number) => {
    if (srsSelections[card.id] !== undefined) return;
    setSrsSelections((prev) => ({ ...prev, [card.id]: optIdx }));
    const isCorrect = optIdx === card.question.correctIndex;
    onResolveSrs(card.id, isCorrect);
  };

  return (
    <div className="space-y-6">
      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#526058]">
            매일 새 문장 학습 · 에빙하우스 망각곡선 오답 복습
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#14211A] tracking-tight">
            데일리 퀴즈 & 오답 복습
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-[#ECEFEA] rounded-xl sm:w-80">
          <button
            type="button"
            onClick={() => setSubView("daily")}
            className={`min-h-[42px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              subView === "daily" ? "bg-white text-[#14211A] shadow-xs" : "text-[#526058]"
            }`}
          >
            오늘의 문장 · 퀴즈
          </button>
          <button
            type="button"
            onClick={() => {
              setNowTick(Date.now());
              setSubView("srs");
            }}
            className={`min-h-[42px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              subView === "srs" ? "bg-white text-[#14211A] shadow-xs" : "text-[#526058]"
            }`}
          >
            오답 복습 ({dueCards.length})
          </button>
        </div>
      </div>

      {subView === "daily" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Today's New Sentence + AI Generator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-emerald-800">
                  오늘의 새로운 문장
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => speakEnglish(dailySentence.en)}
                    aria-label="오늘의 문장 듣기"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#F4F6F3] hover:bg-[#E9EDE7] text-[#14211A]"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onToggleSave(dailySentence.en, dailySentence.ko, dailySentence.track)
                    }
                    aria-label="오늘의 문장 저장"
                    className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors ${
                      isSaved(dailySentence.en)
                        ? "bg-emerald-700 text-white"
                        : "bg-[#F4F6F3] hover:bg-[#E9EDE7] text-[#14211A]"
                    }`}
                  >
                    {isSaved(dailySentence.en) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-lg sm:text-xl font-bold text-[#14211A] leading-snug">
                  {dailySentence.en}
                </p>
                <p className="mt-2 text-sm font-medium text-[#35443B]">{dailySentence.ko}</p>
              </div>

              <div className="bg-[#F7F9F7] border border-[#E5E8E3] rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-900">
                  핵심 표현: {dailySentence.keyExpression}
                </div>
                <p className="text-xs text-[#526058] leading-relaxed">
                  {dailySentence.nuanceKo}
                </p>
              </div>
            </div>

            {/* AI Fresh Quiz Generator */}
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-[#14211A]">
                AI 맞춤 데일리 퀴즈 새로 받기
              </div>
              <p className="text-xs text-[#526058]">
                원하는 학습 영역을 선택하면 새로운 오늘의 문장과 3문제 퀴즈를 즉시 만들어 드립니다.
              </p>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F5F2] rounded-xl">
                {(
                  [
                    { id: "grammar", label: "문법" },
                    { id: "writing", label: "영작" },
                    { id: "conversation", label: "회화" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuizTrack(t.id)}
                    className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                      quizTrack === t.id
                        ? "bg-white text-[#14211A] shadow-xs"
                        : "text-[#526058]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={loadingAiQuiz}
                onClick={() => void handleGenerateAiQuiz()}
                className="w-full min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                {loadingAiQuiz ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    새 퀴즈 생성 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    새 문장 & 퀴즈 생성
                  </>
                )}
              </button>

              {aiError && <p className="text-xs text-rose-700">{aiError}</p>}
            </div>
          </div>

          {/* Right: Quiz Cards */}
          <div className="lg:col-span-7 space-y-4">
            {questions.map((q, qIdx) => {
              const picked = selectedAnswers[q.id];
              const answered = picked !== undefined;
              const isRight = picked === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#526058]">
                    <span className="font-mono tabular-nums font-semibold">
                      문제 0{qIdx + 1} ·{" "}
                      {q.track === "grammar" ? "문법" : q.track === "writing" ? "영작" : "회화"}
                    </span>
                    {answered && (
                      <span
                        className={`font-semibold ${
                          isRight ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isRight ? "정답 (+15 XP)" : "오답 · 1일 후 복습 등록됨"}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#14211A]">
                      {q.questionKo}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#35443B] font-medium bg-[#F8FAF8] border border-[#ECEFEA] rounded-xl px-3.5 py-2.5">
                      {q.promptEn}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isPicked = picked === optIdx;
                      const isAnswer = q.correctIndex === optIdx;
                      let optionStyle =
                        "bg-white border-[#DCE1DA] text-[#14211A] hover:bg-[#F7F9F7]";
                      if (answered) {
                        if (isAnswer) {
                          optionStyle =
                            "bg-[#EFF6F0] border-emerald-600 text-emerald-950 font-semibold";
                        } else if (isPicked) {
                          optionStyle =
                            "bg-rose-50 border-rose-400 text-rose-900";
                        } else {
                          optionStyle = "bg-[#FAFBFA] border-[#ECEFEA] text-[#8A978F]";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={answered}
                          onClick={() => handlePickDailyOption(q, optIdx)}
                          className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border text-sm transition-colors flex items-center gap-3 ${optionStyle}`}
                        >
                          <span className="font-mono tabular-nums text-xs opacity-70 shrink-0">
                            {optIdx + 1}.
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <div className="bg-[#F4F7F4] rounded-xl p-4 space-y-2">
                      <p className="text-xs sm:text-sm text-[#1F2D24] leading-relaxed">
                        {q.explanationKo}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8E2]">
                        <div className="text-xs">
                          <span className="font-semibold text-[#14211A]">{q.keySentenceEn}</span>
                          <span className="block text-[#526058]">{q.keySentenceKo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakEnglish(q.keySentenceEn)}
                          aria-label="정답 문장 발음 듣기"
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-white border border-[#DCE1DA] text-[#14211A] shrink-0"
                        >
                          <Volume2 className="w-4 h-4 text-emerald-700" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subView === "srs" && (
        <div className="space-y-5">
          {/* SRS Summary & Time Simulation Bar */}
          <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-[#14211A]">
                간격 반복(SRS) 망각곡선 복습 시스템
              </div>
              <p className="text-xs text-[#526058]">
                틀린 문제는 1일 → 3일 → 7일 → 14일 간격으로 자동 재출제되어 장기 기억으로 전환됩니다.
              </p>
              <div className="pt-1 text-xs font-mono tabular-nums text-[#14211A]">
                오늘 복습 필요: <span className="font-bold text-emerald-700">{dueCards.length}개</span> ·
                대기 중: <span className="font-semibold">{upcomingCards.length}개</span> ·
                완전 정복: <span className="font-semibold">{masteredCount}개</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onShiftSrsDays(1);
                setNowTick(Date.now());
              }}
              className="min-h-[44px] px-4 rounded-xl border border-[#DCE1DA] bg-[#F8FAF8] hover:bg-[#EFF6F0] text-xs font-semibold text-[#14211A] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FastForward className="w-4 h-4 text-emerald-700" />
              복습 일정 +1일 당기기 (체험)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Due Questions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold text-[#526058] px-1">
                지금 복습해야 할 오답 ({dueCards.length})
              </div>

              {dueCards.length === 0 ? (
                <div className="bg-white border border-[#E5E8E3] rounded-2xl p-8 text-center space-y-2">
                  <RotateCcw className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-sm font-semibold text-[#14211A]">
                    지금 복습할 오답이 모두 완료되었습니다
                  </p>
                  <p className="text-xs text-[#526058]">
                    대기 중인 문제가 복습 주기에 도달하면 이 목록에 자동으로 다시 나타납니다.
                  </p>
                </div>
              ) : (
                dueCards.map((card) => {
                  const picked = srsSelections[card.id];
                  const answered = picked !== undefined;
                  const isRight = picked === card.question.correctIndex;

                  return (
                    <div
                      key={card.id}
                      className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[#526058]">
                        <span>
                          이전 오답 {card.wrongCount}회 · 현재 간격 {card.intervalDays}일
                        </span>
                        {answered && (
                          <span
                            className={`font-semibold ${
                              isRight ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {isRight ? "복습 성공 (+20 XP)" : "다시 1일 후 복습 예약"}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#14211A]">
                          {card.question.questionKo}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#35443B] font-medium bg-[#F8FAF8] border border-[#ECEFEA] rounded-xl px-3.5 py-2.5">
                          {card.question.promptEn}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {card.question.options.map((opt, idx) => {
                          const isPicked = picked === idx;
                          const isAnswer = card.question.correctIndex === idx;
                          let cls = "bg-white border-[#DCE1DA] text-[#14211A] hover:bg-[#F7F9F7]";
                          if (answered) {
                            if (isAnswer) {
                              cls = "bg-[#EFF6F0] border-emerald-600 text-emerald-950 font-semibold";
                            } else if (isPicked) {
                              cls = "bg-rose-50 border-rose-400 text-rose-900";
                            } else {
                              cls = "bg-[#FAFBFA] border-[#ECEFEA] text-[#8A978F]";
                            }
                          }
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={answered}
                              onClick={() => handlePickSrsOption(card, idx)}
                              className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border text-sm transition-colors flex items-center gap-3 ${cls}`}
                            >
                              <span className="font-mono tabular-nums text-xs opacity-70 shrink-0">
                                {idx + 1}.
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div className="bg-[#F4F7F4] rounded-xl p-3.5 text-xs text-[#1F2D24] leading-relaxed">
                          {card.question.explanationKo}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Upcoming Schedule Queue */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-semibold text-[#526058] px-1">
                다가오는 복습 일정 ({upcomingCards.length})
              </div>
              <div className="bg-white border border-[#E5E8E3] rounded-2xl divide-y divide-[#ECEFEA]">
                {upcomingCards.length === 0 ? (
                  <p className="p-6 text-xs text-[#526058] text-center">
                    예정된 복습 문제가 없습니다.
                  </p>
                ) : (
                  upcomingCards.map((card) => (
                    <div key={card.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-emerald-800 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDueText(card.nextReviewAt, nowTick)}
                        </span>
                        <span className="font-mono tabular-nums text-[#526058]">
                          주기 {card.intervalDays}일
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#14211A] line-clamp-2">
                        {card.question.keySentenceEn}
                      </p>
                      <p className="text-xs text-[#526058]">{card.question.keySentenceKo}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
