import { ChangeEvent, useRef, useState } from "react";
import { Download, Trash2, Upload, Volume2 } from "lucide-react";
import { GRAMMAR_LESSONS, WRITING_PROMPTS } from "../data/curriculum.ts";
import { StudyMode, UserProgress } from "../types.ts";
import { speakEnglish } from "../utils/speech.ts";
import { exportProgressToJson, formatDateKey, parseImportedProgressJson } from "../utils/storage.ts";
import { PlantGarden } from "./PlantGarden.tsx";

interface StatsDashboardTabProps {
  username: string;
  progress: UserProgress;
  onToggleSave: (en: string, ko: string, category: StudyMode) => void;
  onImportProgress: (imported: UserProgress) => void;
  onResetProgress: () => void;
}

export function StatsDashboardTab({
  username,
  progress,
  onToggleSave,
  onImportProgress,
  onResetProgress,
}: StatsDashboardTabProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(progress.studyLogs.length - 1);
  const [confirmReset, setConfirmReset] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    try {
      const jsonString = exportProgressToJson(username, progress);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sprouteng-${username}-${formatDateKey()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTransferFeedback({
        type: "success",
        text: "학습 기록 JSON 파일을 다운로드했습니다. 다른 기기에서 'JSON 가져오기'로 불러오세요.",
      });
    } catch {
      setTransferFeedback({
        type: "error",
        text: "JSON 파일 내보내기 중 오류가 발생했습니다.",
      });
    }
  };

  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const imported = parseImportedProgressJson(text);
      onImportProgress(imported);
      setTransferFeedback({
        type: "success",
        text: "JSON 파일에서 학습 기록을 성공적으로 불러왔습니다.",
      });
    } catch (err) {
      setTransferFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "파일을 불러오지 못했습니다.",
      });
    }
  };

  const accuracyPct =
    progress.quizAttemptTotal > 0
      ? Math.round((progress.quizCorrectTotal / progress.quizAttemptTotal) * 100)
      : 0;

  const grammarPct = Math.min(
    100,
    Math.round((progress.completedGrammarIds.length / GRAMMAR_LESSONS.length) * 100)
  );
  const writingPct = Math.min(
    100,
    Math.round((progress.completedWritingIds.length / WRITING_PROMPTS.length) * 100)
  );
  const convPct = Math.min(100, Math.round((progress.conversationTurnsTotal / 20) * 100));
  const totalSrs = progress.srsQueue.length + progress.srsRecoveredTotal;
  const srsPct =
    totalSrs > 0 ? Math.min(100, Math.round((progress.srsRecoveredTotal / totalSrs) * 100)) : 0;

  const maxXpInWeek = Math.max(60, ...progress.studyLogs.map((l) => l.xpEarned));
  const focusedLog = progress.studyLogs[selectedDayIdx] ?? progress.studyLogs[progress.studyLogs.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[#526058]">
            영어 실력 성장 · 주간 학습 리포트
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#14211A] tracking-tight">
            성장 대시보드 & 나의 정원
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[40px] px-3.5 rounded-xl border border-[#DCE1DA] bg-white hover:bg-[#EFF6F0] text-xs font-semibold text-[#14211A] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            JSON 내보내기
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[40px] px-3.5 rounded-xl border border-[#DCE1DA] bg-white hover:bg-[#EFF6F0] text-xs font-semibold text-[#14211A] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            JSON 가져오기
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                  setTransferFeedback({
                    type: "success",
                    text: "현재 계정의 학습 기록을 초기화했습니다.",
                  });
                }}
                className="min-h-[40px] px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                기록 완전히 지우기
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[40px] px-3 rounded-xl bg-[#ECEFEA] text-[#14211A] text-xs font-medium whitespace-nowrap shrink-0"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[40px] px-3 rounded-xl border border-[#DCE1DA] bg-white hover:bg-[#F7F9F7] text-xs font-medium text-[#526058] whitespace-nowrap shrink-0"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {transferFeedback && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-xs font-medium ${
            transferFeedback.type === "success"
              ? "bg-[#EFF6F0] border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {transferFeedback.text}
        </div>
      )}

      {/* Botanical Plant Growth Level Showcase */}
      <PlantGarden xp={progress.xp} streakDays={progress.streakDays} />

      {/* 4 KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-medium text-[#526058]">누적 경험치</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#14211A]">
            {progress.xp}
            <span className="text-sm font-normal text-[#526058] ml-1">XP</span>
          </div>
          <div className="mt-1 text-xs text-emerald-700">식물 성장 양분</div>
        </div>

        <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-medium text-[#526058]">연속 학습</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#14211A]">
            {progress.streakDays}
            <span className="text-sm font-normal text-[#526058] ml-1">일</span>
          </div>
          <div className="mt-1 text-xs text-[#526058]">
            {progress.streakDays > 0 ? "매일 루틴 유지 중" : "오늘 첫 학습을 시작해 보세요"}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-medium text-[#526058]">퀴즈 정답률</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#14211A]">
            {accuracyPct}
            <span className="text-sm font-normal text-[#526058] ml-0.5">%</span>
          </div>
          <div className="mt-1 text-xs font-mono tabular-nums text-[#526058]">
            {progress.quizCorrectTotal} / {progress.quizAttemptTotal} 문제
          </div>
        </div>

        <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-medium text-[#526058]">복습 성공 오답</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#14211A]">
            {progress.srsRecoveredTotal}
            <span className="text-sm font-normal text-[#526058] ml-1">개</span>
          </div>
          <div className="mt-1 text-xs text-[#526058]">망각곡선 복습 완료</div>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Weekly XP & Activity Chart */}
        <div className="lg:col-span-7 bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#14211A]">최근 7일 학습량</h3>
              <p className="text-xs text-[#526058]">요일 막대를 선택하면 세부 활동 내역을 확인합니다</p>
            </div>
            {focusedLog && (
              <div className="text-xs font-mono tabular-nums text-emerald-800 font-semibold">
                {focusedLog.date} ({focusedLog.weekdayLabel}) · +{focusedLog.xpEarned} XP
              </div>
            )}
          </div>

          {/* Interactive SVG / CSS Bar Chart */}
          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4">
            {progress.studyLogs.map((log, idx) => {
              const hasXp = log.xpEarned > 0;
              const heightPct = hasXp
                ? Math.max(10, Math.round((log.xpEarned / maxXpInWeek) * 100))
                : 4;
              const isSelected = idx === selectedDayIdx;
              return (
                <button
                  key={log.date}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className="h-full flex flex-col items-center justify-end gap-2 group focus-visible:outline-none"
                >
                  <span className="text-[11px] font-mono tabular-nums text-[#526058]">
                    {log.xpEarned}
                  </span>
                  <div className="w-full max-w-[38px] h-28 bg-[#F2F5F2] rounded-xl flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 ${
                        !hasXp
                          ? "bg-[#DCE1DA]"
                          : isSelected
                            ? "bg-emerald-700"
                            : "bg-emerald-500/70 group-hover:bg-emerald-600"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-emerald-800" : "text-[#526058]"
                    }`}
                  >
                    {log.weekdayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {focusedLog && (
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#ECEFEA] text-center">
              <div className="bg-[#F8FAF8] rounded-xl py-2.5 px-2">
                <div className="text-[11px] text-[#526058]">문법 학습</div>
                <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-[#14211A]">
                  {focusedLog.grammarCount}회
                </div>
              </div>
              <div className="bg-[#F8FAF8] rounded-xl py-2.5 px-2">
                <div className="text-[11px] text-[#526058]">영작 교정</div>
                <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-[#14211A]">
                  {focusedLog.writingCount}편
                </div>
              </div>
              <div className="bg-[#F8FAF8] rounded-xl py-2.5 px-2">
                <div className="text-[11px] text-[#526058]">회화 발화</div>
                <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-[#14211A]">
                  {focusedLog.conversationTurns}턴
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Track Mastery & Saved Expressions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-[#14211A]">영역별 숙련도</h3>
            <div className="space-y-3.5">
              {[
                { label: "월·수 영어 문법", pct: grammarPct, sub: `${progress.completedGrammarIds.length}/${GRAMMAR_LESSONS.length} 단원` },
                { label: "화·목 영어 영작", pct: writingPct, sub: `${progress.completedWritingIds.length}/${WRITING_PROMPTS.length} 미션` },
                { label: "금·토·일 영어 회화", pct: convPct, sub: `총 ${progress.conversationTurnsTotal}턴 대화` },
                { label: "오답 기억 유지율", pct: srsPct, sub: `${progress.srsRecoveredTotal}개 복습 완료` },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#14211A]">{row.label}</span>
                    <span className="font-mono tabular-nums text-[#526058]">
                      {row.sub} · {row.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#EDF1EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5E8E3] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#14211A]">저장한 핵심 표현</h3>
              <span className="text-xs font-mono tabular-nums text-[#526058]">
                {progress.savedExpressions.length}개
              </span>
            </div>

            {progress.savedExpressions.length === 0 ? (
              <p className="text-xs text-[#526058] py-4 text-center">
                아직 저장한 표현이 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-[#ECEFEA] max-h-60 overflow-y-auto">
                {progress.savedExpressions.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#14211A]">{item.en}</p>
                      <p className="text-xs text-[#526058] mt-0.5">{item.ko}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => speakEnglish(item.en)}
                        aria-label="표현 듣기"
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#526058] hover:text-[#14211A] hover:bg-[#F4F6F3]"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleSave(item.en, item.ko, item.category)}
                        aria-label="표현 삭제"
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#526058] hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
