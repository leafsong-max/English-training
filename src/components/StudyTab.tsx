import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  PenLine,
  Send,
  Volume2,
} from "lucide-react";
import {
  CONVERSATION_SCENARIOS,
  GRAMMAR_LESSONS,
  STUDY_TRACKS,
  WEEKDAY_SCHEDULE,
  WRITING_PROMPTS,
  getTodayWeekdayItem,
} from "../data/curriculum.ts";
import {
  ChatMessage,
  CorrectionResult,
  StudyMode,
  UserProgress,
  WeekdayKey,
} from "../types.ts";
import { requestConversationTurn, requestSentenceCorrection } from "../utils/api.ts";
import {
  isSpeechRecognitionSupported,
  speakEnglish,
  startEnglishListening,
} from "../utils/speech.ts";
import { CorrectionFeedbackPanel } from "./CorrectionFeedbackPanel.tsx";
import { PlantGarden } from "./PlantGarden.tsx";

interface StudyTabProps {
  progress: UserProgress;
  onCompleteGrammar: (lessonId: string) => void;
  onCompleteWriting: (promptId: string) => void;
  onConversationTurn: () => void;
  onToggleSave: (en: string, ko: string, category: StudyMode) => void;
  onInspectGrowth: () => void;
}

export function StudyTab({
  progress,
  onCompleteGrammar,
  onCompleteWriting,
  onConversationTurn,
  onToggleSave,
  onInspectGrowth,
}: StudyTabProps) {
  const todayItem = getTodayWeekdayItem();
  const [selectedDay, setSelectedDay] = useState<WeekdayKey>(todayItem.key);
  const [activeMode, setActiveMode] = useState<StudyMode>(todayItem.mode);

  // Grammar state
  const [selectedGrammarIdx, setSelectedGrammarIdx] = useState(0);
  const [grammarDraft, setGrammarDraft] = useState("");
  const [grammarChecking, setGrammarChecking] = useState(false);
  const [grammarFeedback, setGrammarFeedback] = useState<CorrectionResult | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);

  // Writing state
  const [selectedWritingIdx, setSelectedWritingIdx] = useState(0);
  const [writingDraft, setWritingDraft] = useState("");
  const [writingChecking, setWritingChecking] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<CorrectionResult | null>(null);
  const [writingError, setWritingError] = useState<string | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [liveWritingAssist, setLiveWritingAssist] = useState(false);

  // Conversation state
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const activeScenario = CONVERSATION_SCENARIOS[selectedScenarioIdx];
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "init-0",
      role: "assistant",
      textEn: CONVERSATION_SCENARIOS[0].openingEn,
      textKo: CONVERSATION_SCENARIOS[0].openingKo,
    },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(
    CONVERSATION_SCENARIOS[0].starterReplies
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const speechSupported = isSpeechRecognitionSupported();

  const currentGrammar = GRAMMAR_LESSONS[selectedGrammarIdx];
  const writingPromptsList = WRITING_PROMPTS;
  const activeWritingPrompt = writingPromptsList[selectedWritingIdx];

  const handleSelectDay = (dayKey: WeekdayKey) => {
    setSelectedDay(dayKey);
    const match = WEEKDAY_SCHEDULE.find((w) => w.key === dayKey);
    if (match) setActiveMode(match.mode);
  };

  const handleSelectTrackTab = (mode: StudyMode) => {
    setActiveMode(mode);
    const currentDayObj = WEEKDAY_SCHEDULE.find((w) => w.key === selectedDay);
    if (currentDayObj?.mode !== mode) {
      const firstMatchingDay = WEEKDAY_SCHEDULE.find((w) => w.mode === mode);
      if (firstMatchingDay) setSelectedDay(firstMatchingDay.key);
    }
  };

  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIdx(index);
    const sc = CONVERSATION_SCENARIOS[index];
    setChatHistory([
      {
        id: `init-${sc.id}`,
        role: "assistant",
        textEn: sc.openingEn,
        textKo: sc.openingKo,
      },
    ]);
    setSuggestedReplies(sc.starterReplies);
    setChatInput("");
    setChatError(null);
  };

  const handleGrammarCheck = async () => {
    if (grammarDraft.trim().length < 3) return;
    setGrammarChecking(true);
    setGrammarError(null);
    try {
      const res = await requestSentenceCorrection({
        text: grammarDraft,
        contextType: "grammar",
        targetPrompt: `${currentGrammar.titleKo}: ${currentGrammar.drillPromptKo}`,
      });
      setGrammarFeedback(res);
      onCompleteGrammar(currentGrammar.id);
    } catch (err) {
      setGrammarError(err instanceof Error ? err.message : "문법 확인 중 오류가 발생했습니다.");
    } finally {
      setGrammarChecking(false);
    }
  };

  const handleWritingCheck = async (award = true) => {
    if (writingDraft.trim().length < 4) return;
    setWritingChecking(true);
    setWritingError(null);
    try {
      const res = await requestSentenceCorrection({
        text: writingDraft,
        contextType: "writing",
        targetPrompt: activeWritingPrompt.koreanPrompt,
      });
      setWritingFeedback(res);
      if (award) {
        onCompleteWriting(activeWritingPrompt.id);
      }
    } catch (err) {
      setWritingError(err instanceof Error ? err.message : "영작 교정 중 오류가 발생했습니다.");
    } finally {
      setWritingChecking(false);
    }
  };

  useEffect(() => {
    if (!liveWritingAssist || activeMode !== "writing") return;
    if (writingDraft.trim().length < 12) return;
    const timer = window.setTimeout(() => {
      void handleWritingCheck(false);
    }, 1100);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writingDraft, liveWritingAssist, activeMode]);

  const handleSendChat = async (textOverride?: string) => {
    const message = (textOverride ?? chatInput).trim();
    if (!message || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      textEn: message,
    };

    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await requestConversationTurn({
        scenarioTitle: activeScenario.titleKo,
        scenarioContext: activeScenario.contextEn,
        history: nextHistory.map((m) => ({ role: m.role, text: m.textEn })),
        userMessage: message,
      });

      setChatHistory((prev) => {
        const updated = prev.map((m) =>
          m.id === userMsg.id ? { ...m, coaching: res.coaching } : m
        );
        return [
          ...updated,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            textEn: res.replyEn,
            textKo: res.replyKo,
          },
        ];
      });
      setSuggestedReplies(res.suggestedReplies || []);
      onConversationTurn();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "회화 응답을 받지 못했습니다.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) return;
    setChatError(null);
    setIsListening(true);
    startEnglishListening(
      (transcript) => {
        setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => setIsListening(false),
      (msg) => setChatError(msg)
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Weekly Schedule + Plant Companion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#526058]">
                오늘은 {todayItem.fullLabel} · 추천 학습: {todayItem.modeLabel}
              </span>
              <span className="text-xs text-[#526058] font-mono tabular-nums">
                주간 루틴 7일
              </span>
            </div>

            {/* 7-Day Horizontal Schedule Selector */}
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {WEEKDAY_SCHEDULE.map((day) => {
                const isSelected = selectedDay === day.key;
                const isToday = todayItem.key === day.key;
                const shortTrack =
                  day.mode === "grammar" ? "문법" : day.mode === "writing" ? "영작" : "회화";
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleSelectDay(day.key)}
                    className={`min-h-[54px] rounded-xl flex flex-col items-center justify-center px-1 py-1.5 text-center transition-colors border ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-[#F8FAF8] text-[#14211A] border-[#E5E8E3] hover:bg-[#EFF6F0]"
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">
                      {day.shortLabel}
                      {isToday && !isSelected ? "·오늘" : ""}
                    </span>
                    <span
                      className={`mt-1 text-[10px] font-medium leading-none ${
                        isSelected ? "text-emerald-100" : "text-[#526058]"
                      }`}
                    >
                      {shortTrack}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Way Study Track Tabs: 월·수 문법 / 화·목 영작 / 금·토·일 회화 */}
          <div className="mt-4 pt-4 border-t border-[#ECEFEA]">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F5F2] rounded-xl">
              {STUDY_TRACKS.map((track) => {
                const active = activeMode === track.mode;
                const Icon =
                  track.mode === "grammar"
                    ? BookOpen
                    : track.mode === "writing"
                      ? PenLine
                      : MessageCircle;
                return (
                  <button
                    key={track.mode}
                    type="button"
                    onClick={() => handleSelectTrackTab(track.mode)}
                    className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                      active
                        ? "bg-white text-[#14211A] shadow-xs"
                        : "text-[#526058] hover:text-[#14211A]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-emerald-700" : ""}`} />
                    <span className="truncate">
                      {track.daysLabel} {track.titleKo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Plant Companion */}
        <div className="lg:col-span-5 flex">
          <div className="w-full flex [&>*]:w-full">
            <PlantGarden
              xp={progress.xp}
              streakDays={progress.streakDays}
              compact
              onInspectGrowth={onInspectGrowth}
            />
          </div>
        </div>
      </div>

      {/* MODE 1: MON / WED — ENGLISH GRAMMAR */}
      {activeMode === "grammar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lesson selector list */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-semibold text-[#526058] px-1">
              월·수 문법 커리큘럼 ({GRAMMAR_LESSONS.length}개 주제)
            </div>
            {GRAMMAR_LESSONS.map((lesson, idx) => {
              const selected = idx === selectedGrammarIdx;
              const done = progress.completedGrammarIds.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    setSelectedGrammarIdx(idx);
                    setGrammarFeedback(null);
                    setGrammarError(null);
                    setGrammarDraft("");
                  }}
                  className={`w-full text-left rounded-2xl p-4 border transition-colors min-h-[60px] ${
                    selected
                      ? "bg-[#EFF6F0] border-emerald-600"
                      : "bg-white border-[#E5E8E3] hover:bg-[#FAFBF9]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#526058]">
                    <span className="font-mono tabular-nums">0{idx + 1}</span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        학습 완료
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#14211A]">
                    {lesson.titleKo}
                  </div>
                  <div className="mt-0.5 text-xs text-[#526058]">{lesson.subtitleKo}</div>
                </button>
              );
            })}
          </div>

          {/* Active Grammar Lesson & Interactive Drill */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 sm:p-6 space-y-5">
              <div>
                <div className="text-xs font-medium text-emerald-800">
                  월 · 수요일 영어 문법 집중
                </div>
                <h3 className="mt-1 text-xl font-bold text-[#14211A]">
                  {currentGrammar.titleKo}
                </h3>
                <p className="mt-2 text-sm text-[#35443B] leading-relaxed">
                  {currentGrammar.ruleSummaryKo}
                </p>
              </div>

              {/* Contrast Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <div className="text-xs font-semibold text-rose-800 mb-1">
                    흔한 실수 (어색한 표현)
                  </div>
                  <p className="text-sm font-medium text-rose-950 line-through">
                    {currentGrammar.incorrectExample}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-[#EFF6F0] p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-emerald-900">
                      올바른 문장
                    </span>
                    <button
                      type="button"
                      onClick={() => speakEnglish(currentGrammar.correctExample)}
                      aria-label="올바른 예문 발음 듣기"
                      className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[#14211A]">
                    {currentGrammar.correctExample}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#526058] bg-[#F8FAF8] border border-[#E5E8E3] rounded-xl p-3.5">
                기억 팁: {currentGrammar.tipKo}
              </div>

              {/* Grammar Application Drill */}
              <div className="pt-4 border-t border-[#ECEFEA] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[#14211A]">
                    직접 문법 적용해 보기 (+25 XP)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGrammarDraft(currentGrammar.sampleAnswerEn)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 min-h-[36px] px-2"
                  >
                    예시 문장 채우기
                  </button>
                </div>
                <p className="text-xs text-[#526058]">{currentGrammar.drillPromptKo}</p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={grammarDraft}
                    onChange={(e) => setGrammarDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleGrammarCheck();
                    }}
                    placeholder="여기에 영어 문장을 직접 작성해 보세요..."
                    className="flex-1 min-h-[46px] rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] px-3.5 text-sm text-[#14211A] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                  />
                  <button
                    type="button"
                    disabled={grammarChecking || grammarDraft.trim().length < 3}
                    onClick={() => void handleGrammarCheck()}
                    className="min-h-[46px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {grammarChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        검사 중
                      </>
                    ) : (
                      "AI 문법 검사"
                    )}
                  </button>
                </div>

                {grammarError && (
                  <p className="text-xs text-rose-700">{grammarError}</p>
                )}
              </div>
            </div>

            {grammarFeedback && (
              <CorrectionFeedbackPanel
                originalText={grammarDraft}
                result={grammarFeedback}
                category="grammar"
                savedExpressions={progress.savedExpressions}
                onToggleSave={onToggleSave}
              />
            )}
          </div>
        </div>
      )}

      {/* MODE 2: TUE / THU — ENGLISH WRITING */}
      {activeMode === "writing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Prompt Picker */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-semibold text-[#526058] px-1">
              화·목 영작 미션 ({writingPromptsList.length}개 주제)
            </div>
            {writingPromptsList.map((item, idx) => {
              const selected = idx === selectedWritingIdx;
              const done = progress.completedWritingIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedWritingIdx(idx);
                    setWritingDraft("");
                    setWritingFeedback(null);
                    setWritingError(null);
                    setShowModelAnswer(false);
                  }}
                  className={`w-full text-left rounded-2xl p-4 border transition-colors min-h-[60px] ${
                    selected
                      ? "bg-[#EFF6F0] border-emerald-600"
                      : "bg-white border-[#E5E8E3] hover:bg-[#FAFBF9]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#526058]">
                    <span>{item.levelLabel}</span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        완료
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#14211A]">
                    {item.titleKo}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Writing Workspace */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-emerald-800">
                  화 · 목요일 영어 영작 · {activeWritingPrompt.levelLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setLiveWritingAssist((v) => !v)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors ${
                    liveWritingAssist
                      ? "bg-[#EFF6F0] text-emerald-800 border border-emerald-200"
                      : "bg-[#F4F6F3] text-[#526058]"
                  }`}
                >
                  입력 중 실시간 교정: {liveWritingAssist ? "켜짐" : "꺼짐"}
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#14211A]">
                  {activeWritingPrompt.titleKo}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-[#1F2D24] bg-[#F7F9F7] border border-[#E5E8E3] rounded-xl p-4 leading-relaxed">
                  “{activeWritingPrompt.koreanPrompt}”
                </p>
              </div>

              <div className="text-xs text-[#526058]">
                활용 힌트 표현:{" "}
                <span className="font-mono text-[#14211A]">
                  {activeWritingPrompt.hintWords.join(" · ")}
                </span>
              </div>

              <textarea
                rows={4}
                value={writingDraft}
                onChange={(e) => setWritingDraft(e.target.value)}
                placeholder="위 한국어 문장의 의미를 담아 영어로 자유롭게 작성해 보세요..."
                className="w-full rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] px-3.5 py-3 text-sm sm:text-base text-[#14211A] placeholder:text-[#8A978F] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowModelAnswer((v) => !v)}
                  className="min-h-[44px] px-3.5 rounded-xl bg-[#F4F6F3] hover:bg-[#E9EDE7] text-xs font-medium text-[#14211A] inline-flex items-center gap-1.5"
                >
                  {showModelAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showModelAnswer ? "모범 답안 숨기기" : "모범 답안 미리보기"}
                </button>

                <button
                  type="button"
                  disabled={writingChecking || writingDraft.trim().length < 4}
                  onClick={() => void handleWritingCheck(true)}
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  {writingChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      첨삭 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      첨삭 받기 (+30 XP)
                    </>
                  )}
                </button>
              </div>

              {showModelAnswer && (
                <div className="rounded-xl border border-[#DCE4DC] bg-[#F4F7F4] p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-1">원어민 모범 영작</div>
                    <p className="text-sm font-medium text-[#14211A]">
                      {activeWritingPrompt.modelAnswerEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(activeWritingPrompt.modelAnswerEn)}
                    aria-label="모범 답안 듣기"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-emerald-800 hover:bg-emerald-100 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {writingError && (
                <p className="text-xs text-rose-700">{writingError}</p>
              )}
            </div>

            {writingFeedback && (
              <CorrectionFeedbackPanel
                originalText={writingDraft}
                result={writingFeedback}
                category="writing"
                savedExpressions={progress.savedExpressions}
                onToggleSave={onToggleSave}
              />
            )}
          </div>
        </div>
      )}

      {/* MODE 3: FRI / SAT / SUN — ENGLISH CONVERSATION */}
      {activeMode === "conversation" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Scenario Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-[#526058] px-1">
              금·토·일 실전 영어 회화 시나리오
            </div>
            {CONVERSATION_SCENARIOS.map((sc, idx) => {
              const selected = idx === selectedScenarioIdx;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={`w-full text-left rounded-2xl p-4 border transition-colors min-h-[60px] ${
                    selected
                      ? "bg-[#EFF6F0] border-emerald-600"
                      : "bg-white border-[#E5E8E3] hover:bg-[#FAFBF9]"
                  }`}
                >
                  <div className="text-sm font-semibold text-[#14211A]">{sc.titleKo}</div>
                  <div className="mt-0.5 text-xs text-[#526058]">{sc.subtitleKo}</div>
                </button>
              );
            })}

            {/* Key Expressions Card */}
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-[#526058]">이 상황 핵심 회화 표현</div>
              <div className="divide-y divide-[#ECEFEA]">
                {activeScenario.keyExpressions.map((expr, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#14211A]">{expr.en}</p>
                      <p className="text-[11px] text-[#526058] mt-0.5">{expr.ko}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(expr.en)}
                      aria-label="핵심 표현 듣기"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#526058] hover:text-[#14211A] hover:bg-[#F4F6F3] shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Partner Stage */}
          <div className="lg:col-span-8 bg-white border border-[#E5E8E3] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 border-b border-[#ECEFEA] flex items-center justify-between gap-2 bg-[#FAFBFA]">
              <div className="min-w-0">
                <div className="text-xs text-emerald-800 font-medium">
                  금 · 토 · 일요일 영어 회화 파트너
                </div>
                <div className="text-sm font-bold text-[#14211A] truncate">
                  {activeScenario.titleKo}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTranslations((v) => !v)}
                className="min-h-[38px] px-3 rounded-xl border border-[#E5E8E3] bg-white text-xs font-medium text-[#14211A] hover:bg-[#F4F6F3] whitespace-nowrap shrink-0"
              >
                한글 해석: {showTranslations ? "표시" : "숨김"}
              </button>
            </div>

            {/* Chat stream */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[420px] overflow-y-auto bg-[#F8FAF8]">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-emerald-700 text-white"
                        : "bg-white border border-[#E5E8E3] text-[#14211A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed">{msg.textEn}</p>
                      <button
                        type="button"
                        onClick={() => speakEnglish(msg.textEn)}
                        aria-label="대화 문장 듣기"
                        className={`min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg shrink-0 ${
                          msg.role === "user"
                            ? "text-emerald-100 hover:bg-emerald-600"
                            : "text-[#526058] hover:bg-[#F4F6F3]"
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {showTranslations && msg.textKo && (
                      <p className="mt-1.5 pt-1.5 border-t border-[#ECEFEA] text-xs text-[#526058]">
                        {msg.textKo}
                      </p>
                    )}
                  </div>

                  {/* Coaching note attached cleanly under user turn */}
                  {msg.role === "user" && msg.coaching && (
                    <div className="mt-1.5 max-w-[88%] sm:max-w-[78%] rounded-xl bg-white border border-[#DCE4DC] px-3.5 py-2.5 text-xs space-y-1">
                      <div className="font-semibold text-emerald-800">
                        {msg.coaching.isNatural ? "자연스러운 답변이에요" : "더 자연스러운 회화 표현"}
                      </div>
                      {!msg.coaching.isNatural && msg.coaching.betterExpression && (
                        <div className="flex items-center justify-between gap-2 font-medium text-[#14211A]">
                          <span>→ {msg.coaching.betterExpression}</span>
                          <button
                            type="button"
                            onClick={() => speakEnglish(msg.coaching!.betterExpression)}
                            className="text-emerald-700 hover:underline shrink-0"
                          >
                            듣기
                          </button>
                        </div>
                      )}
                      <p className="text-[#526058] leading-relaxed">{msg.coaching.feedbackKo}</p>
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-[#526058]">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  상대방이 답변을 생각하고 있습니다...
                </div>
              )}
            </div>

            {/* Suggested Replies */}
            {suggestedReplies.length > 0 && (
              <div className="px-4 py-2.5 bg-white border-t border-[#ECEFEA] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-medium text-[#526058] whitespace-nowrap shrink-0">
                  추천 답변:
                </span>
                {suggestedReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChatInput(reply)}
                    className="min-h-[36px] px-3 py-1 rounded-xl border border-[#DCE1DA] bg-[#F8FAF8] hover:bg-[#EFF6F0] text-xs text-[#14211A] whitespace-nowrap shrink-0 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#ECEFEA] space-y-2">
              {chatError && <p className="text-xs text-rose-700">{chatError}</p>}
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    aria-label="음성으로 말하기"
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                      isListening
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-[#F4F6F3] text-[#14211A] border-[#E5E8E3] hover:bg-[#E9EDE7]"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSendChat();
                  }}
                  placeholder="영어로 대화를 이어가 보세요..."
                  className="flex-1 min-h-[44px] rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] px-3.5 text-sm text-[#14211A] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
                <button
                  type="button"
                  disabled={chatLoading || !chatInput.trim()}
                  onClick={() => void handleSendChat()}
                  className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
