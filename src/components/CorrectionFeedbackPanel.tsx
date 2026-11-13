import { Bookmark, Check, Volume2 } from "lucide-react";
import { CorrectionResult, SavedExpression, StudyMode } from "../types.ts";
import { speakEnglish } from "../utils/speech.ts";

interface CorrectionFeedbackPanelProps {
  originalText: string;
  result: CorrectionResult;
  category: StudyMode;
  savedExpressions: SavedExpression[];
  onToggleSave: (en: string, ko: string, category: StudyMode) => void;
}

export function CorrectionFeedbackPanel({
  originalText,
  result,
  category,
  savedExpressions,
  onToggleSave,
}: CorrectionFeedbackPanelProps) {
  const isSaved = (en: string) =>
    savedExpressions.some((s) => s.en.toLowerCase() === en.trim().toLowerCase());

  return (
    <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-6 space-y-5">
      {/* Header status + score */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ECEFEA]">
        <div className="text-xs font-medium text-[#526058]">
          {result.isNatural ? "자연스러운 문장입니다" : "문법 · 표현 교정 완료"} · 정확도{" "}
          <span className="font-mono tabular-nums font-semibold text-[#14211A]">
            {result.accuracyScore}점
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => speakEnglish(result.correctedSentence)}
            className="min-h-[40px] px-3 rounded-xl text-xs font-medium text-[#14211A] bg-[#F4F6F3] hover:bg-[#E9EDE7] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            발음 듣기
          </button>
          <button
            type="button"
            onClick={() =>
              onToggleSave(result.correctedSentence, result.explanationKo, category)
            }
            className={`min-h-[40px] px-3 rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isSaved(result.correctedSentence)
                ? "bg-emerald-700 text-white"
                : "bg-[#F4F6F3] text-[#14211A] hover:bg-[#E9EDE7]"
            }`}
          >
            {isSaved(result.correctedSentence) ? (
              <>
                <Check className="w-4 h-4" />
                저장됨
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                표현 저장
              </>
            )}
          </button>
        </div>
      </div>

      {/* Corrected Sentence */}
      <div>
        <div className="text-xs font-medium text-[#526058] mb-1.5">교정된 영어 문장</div>
        <p className="text-base sm:text-lg font-semibold text-[#14211A] leading-relaxed">
          {result.correctedSentence}
        </p>
        {originalText.trim() !== result.correctedSentence.trim() && (
          <p className="mt-1.5 text-xs text-[#6B7870] line-through">
            입력 문장: {originalText}
          </p>
        )}
      </div>

      {/* Error Highlights */}
      {result.errorHighlights.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-[#526058]">세부 수정 포인트</div>
          <div className="divide-y divide-[#ECEFEA] border border-[#E5E8E3] rounded-xl bg-[#FAFBFA]">
            {result.errorHighlights.map((item, idx) => (
              <div key={idx} className="p-3.5 text-sm">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span className="text-rose-700 line-through">{item.original}</span>
                  <span className="text-[#526058]" aria-hidden="true">→</span>
                  <span className="text-emerald-800 font-semibold">{item.corrected}</span>
                </div>
                <p className="mt-1 text-xs text-[#526058] leading-relaxed">{item.reasonKo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-[#F4F7F4] rounded-xl p-3.5 sm:p-4">
        <div className="text-xs font-semibold text-emerald-900 mb-1">튜터 설명</div>
        <p className="text-sm text-[#1F2D24] leading-relaxed">{result.explanationKo}</p>
        {result.keyTakeawayKo && (
          <p className="mt-2 text-xs text-[#526058] pt-2 border-t border-[#E2E8E2]">
            핵심 포인트: {result.keyTakeawayKo}
          </p>
        )}
      </div>

      {/* Natural Alternatives */}
      {result.naturalAlternatives.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-[#526058]">원어민처럼 자연스러운 추천 표현</div>
          <div className="grid grid-cols-1 gap-2.5">
            {result.naturalAlternatives.map((alt, idx) => {
              const saved = isSaved(alt.expression);
              return (
                <div
                  key={idx}
                  className="border border-[#E5E8E3] rounded-xl p-3.5 flex items-start justify-between gap-3 bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-emerald-800">{alt.tone}</div>
                    <p className="mt-0.5 text-sm font-semibold text-[#14211A] leading-snug">
                      {alt.expression}
                    </p>
                    <p className="mt-1 text-xs text-[#526058]">{alt.meaningKo}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => speakEnglish(alt.expression)}
                      aria-label="추천 표현 듣기"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#526058] hover:text-[#14211A] hover:bg-[#F4F6F3] transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSave(alt.expression, alt.meaningKo, category)}
                      aria-label="추천 표현 저장"
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                        saved
                          ? "text-emerald-700 bg-[#EFF6F0]"
                          : "text-[#526058] hover:text-[#14211A] hover:bg-[#F4F6F3]"
                      }`}
                    >
                      {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
