import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Send, Volume2 } from "lucide-react";
import { CorrectionResult, SavedExpression, StudyMode } from "../types.ts";
import { requestSentenceCorrection } from "../utils/api.ts";
import { speakEnglish } from "../utils/speech.ts";
import { CorrectionFeedbackPanel } from "./CorrectionFeedbackPanel.tsx";

interface CorrectorStudioTabProps {
  savedExpressions: SavedExpression[];
  onToggleSave: (en: string, ko: string, category: StudyMode) => void;
  onRecordCorrectionXp: (xpDelta: number) => void;
}

const SAMPLE_SENTENCES = [
  {
    label: "감정 분사 실수",
    text: "I am very exciting to start my new job next Monday.",
  },
  {
    label: "시제·관사 교정",
    text: "Yesterday I go to cafe near station and drink iced coffee.",
  },
  {
    label: "비즈니스 표현 다듬기",
    text: "Please confirm me if tomorrow meeting time is okay for you.",
  },
];

export function CorrectorStudioTab({
  savedExpressions,
  onToggleSave,
  onRecordCorrectionXp,
}: CorrectorStudioTabProps) {
  const [inputText, setInputText] = useState("");
  const [liveMode, setLiveMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const lastCheckedRef = useRef<string>("");

  const runCorrection = async (textToCheck: string, awardXp: boolean) => {
    const trimmed = textToCheck.trim();
    if (trimmed.length < 4) return;
    if (trimmed === lastCheckedRef.current && result) return;

    setLoading(true);
    setError(null);
    try {
      const data = await requestSentenceCorrection({
        text: trimmed,
        contextType: "general",
      });
      lastCheckedRef.current = trimmed;
      setResult(data);
      if (awardXp) {
        onRecordCorrectionXp(10);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "문장 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time debounced correction when liveMode is active
  useEffect(() => {
    if (!liveMode) return;
    const trimmed = inputText.trim();
    if (trimmed.length < 8) return;
    if (trimmed === lastCheckedRef.current) return;

    const timer = window.setTimeout(() => {
      void runCorrection(trimmed, false);
    }, 950);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, liveMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-medium text-[#526058]">
          실시간 AI 문장 교정 · 원어민 자연스러운 표현 추천
        </div>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#14211A] tracking-tight">
          실시간 영작 코치
        </h2>
        <p className="mt-1 text-sm text-[#526058]">
          영어 문장을 입력하면 입력 도중 또는 버튼 클릭 시 즉시 문법을 교정하고 상황별 원어민 표현을 추천합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="live-corrector-input" className="text-sm font-semibold text-[#14211A]">
                내 영어 문장 입력
              </label>
              <button
                type="button"
                onClick={() => setLiveMode((prev) => !prev)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  liveMode
                    ? "bg-[#EFF6F0] text-emerald-800 border border-emerald-200"
                    : "bg-[#F4F6F3] text-[#526058] border border-transparent"
                }`}
              >
                실시간 자동 교정: {liveMode ? "켜짐" : "꺼짐"}
              </button>
            </div>

            <textarea
              id="live-corrector-input"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="예: I am very exciting to meet my friend at the cafe yesterday."
              className="w-full rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] px-3.5 py-3 text-sm sm:text-base text-[#14211A] placeholder:text-[#8A978F] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#526058] font-mono tabular-nums">
                {inputText.trim().length}자
              </span>
              <div className="flex items-center gap-2">
                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("");
                      setResult(null);
                      setError(null);
                      lastCheckedRef.current = "";
                    }}
                    className="min-h-[44px] px-3 rounded-xl text-xs font-medium text-[#526058] hover:bg-[#F4F6F3] transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    지우기
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading || inputText.trim().length < 2}
                  onClick={() => void runCorrection(inputText, true)}
                  className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      교정 & 표현 추천
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick sample sentences */}
            <div className="pt-3 border-t border-[#ECEFEA]">
              <div className="text-xs font-medium text-[#526058] mb-2">
                자주 하는 실수 예시로 바로 테스트
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SENTENCES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setInputText(sample.text);
                      void runCorrection(sample.text, true);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5E8E3] bg-[#F8FAF8] hover:bg-[#EFF6F0] text-xs font-medium text-[#14211A] transition-colors text-left"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Expressions */}
          <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#14211A]">저장한 내 표현함</h3>
              <span className="text-xs font-mono tabular-nums text-[#526058]">
                {savedExpressions.length}개
              </span>
            </div>
            {savedExpressions.length === 0 ? (
              <p className="text-xs text-[#526058] py-4 text-center">
                마음에 드는 교정 문장이나 추천 표현을 저장하면 여기에 모입니다.
              </p>
            ) : (
              <div className="divide-y divide-[#ECEFEA] max-h-64 overflow-y-auto">
                {savedExpressions.slice(0, 6).map((exp) => (
                  <div key={exp.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#14211A] leading-snug">{exp.en}</p>
                      <p className="text-xs text-[#526058] mt-0.5">{exp.ko}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(exp.en)}
                      aria-label="저장 표현 발음 듣기"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#526058] hover:text-[#14211A] hover:bg-[#F4F6F3] shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result Column */}
        <div className="lg:col-span-7">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 mb-4">
              {error}
            </div>
          )}

          {loading && !result && (
            <div className="bg-white border border-[#E5E8E3] rounded-2xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mx-auto" />
              <p className="mt-3 text-sm font-medium text-[#14211A]">
                문법과 자연스러움을 분석하고 있습니다...
              </p>
            </div>
          )}

          {result ? (
            <CorrectionFeedbackPanel
              originalText={lastCheckedRef.current || inputText}
              result={result}
              category="writing"
              savedExpressions={savedExpressions}
              onToggleSave={onToggleSave}
            />
          ) : (
            !loading && (
              <div className="bg-white border border-[#E5E8E3] rounded-2xl p-8 text-center space-y-2">
                <p className="text-base font-semibold text-[#14211A]">
                  아직 분석된 문장이 없습니다
                </p>
                <p className="text-sm text-[#526058] max-w-md mx-auto">
                  왼쪽 입력창에 영어로 문장을 써보거나 예시 문장을 누르면, 실시간으로 오류를 찾고 원어민식 대안을 3가지 톤으로 제안해 드립니다.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
