import { PLANT_STAGES, getPlantStage } from "../data/curriculum.ts";

interface PlantGardenProps {
  xp: number;
  streakDays: number;
  compact?: boolean;
  onInspectGrowth?: () => void;
}

export function PlantIllustration({ level, size = 120 }: { level: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`식물 성장 단계 레벨 ${level}`}
      className="select-none shrink-0"
    >
      {/* Subtle sunlit halo */}
      <circle cx="80" cy="72" r="56" fill="#EDF4EE" />

      {/* Soil & Pot */}
      <path d="M48 114H112L104 144C103.3 146.4 101.1 148 98.6 148H61.4C58.9 148 56.7 146.4 56 144L48 114Z" fill="#C97B59" />
      <rect x="43" y="106" width="74" height="11" rx="4" fill="#D98B68" />
      <ellipse cx="80" cy="107" rx="31" ry="4" fill="#6D4C3D" />

      {/* Level 1: Seed */}
      {level === 1 && (
        <g>
          <path d="M74 103C74 96.5 78.5 92 80 92C81.5 92 86 96.5 86 103C86 106.5 83.3 108 80 108C76.7 108 74 106.5 74 103Z" fill="#9C6B43" />
          <path d="M80 95C80 95 82 99 81 104" stroke="#C5986D" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="67" cy="95" r="2.2" fill="#84CC16" opacity="0.7" />
          <circle cx="94" cy="92" r="1.8" fill="#84CC16" opacity="0.5" />
        </g>
      )}

      {/* Level 2: Tender Sprout */}
      {level === 2 && (
        <g className="plant-sway">
          <path d="M80 107V79" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" />
          <path d="M80 82C72 80 65 73 67 66C73 66 79 73 80 82Z" fill="#4CAF50" />
          <path d="M80 80C88 78 95 71 93 64C87 64 81 71 80 80Z" fill="#66BB6A" />
        </g>
      )}

      {/* Level 3: Young Stem */}
      {level === 3 && (
        <g className="plant-sway">
          <path d="M80 107C80 92 79 76 80 56" stroke="#256D3B" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M80 88C68 86 58 78 60 69C69 69 77 77 80 88Z" fill="#2E7D32" />
          <path d="M80 84C92 82 102 74 100 65C91 65 83 73 80 84Z" fill="#43A047" />
          <path d="M80 65C71 62 65 53 68 46C76 47 80 55 80 65Z" fill="#66BB6A" />
          <path d="M80 62C88 58 94 50 91 43C84 44 80 52 80 62Z" fill="#81C784" />
        </g>
      )}

      {/* Level 4: Leafy Foliage */}
      {level === 4 && (
        <g className="plant-sway">
          <path d="M80 107C80 88 78 68 80 42" stroke="#1E5B32" strokeWidth="5" strokeLinecap="round" />
          <path d="M80 82C70 76 62 67 56 58" stroke="#1E5B32" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 74C90 68 98 60 104 51" stroke="#1E5B32" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="61" cy="84" rx="13" ry="7" transform="rotate(-22 61 84)" fill="#2E7D32" />
          <ellipse cx="99" cy="82" rx="13" ry="7" transform="rotate(22 99 82)" fill="#388E3C" />
          <ellipse cx="54" cy="57" rx="12" ry="7" transform="rotate(-35 54 57)" fill="#43A047" />
          <ellipse cx="105" cy="52" rx="12" ry="7" transform="rotate(35 105 52)" fill="#4CAF50" />
          <ellipse cx="70" cy="46" rx="11" ry="6.5" transform="rotate(-18 70 46)" fill="#66BB6A" />
          <ellipse cx="90" cy="44" rx="11" ry="6.5" transform="rotate(18 90 44)" fill="#81C784" />
          <path d="M80 42C76 34 78 27 80 25C82 27 84 34 80 42Z" fill="#A5D6A7" />
        </g>
      )}

      {/* Level 5: Budding Blossom */}
      {level === 5 && (
        <g className="plant-sway">
          <path d="M80 107C79 86 81 62 80 35" stroke="#1B5E20" strokeWidth="5" strokeLinecap="round" />
          <path d="M80 80C68 74 58 63 52 52" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 70C92 64 102 54 108 44" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="60" cy="84" rx="14" ry="7.5" transform="rotate(-24 60 84)" fill="#2E7D32" />
          <ellipse cx="100" cy="82" rx="14" ry="7.5" transform="rotate(24 100 82)" fill="#2E7D32" />
          <ellipse cx="54" cy="54" rx="12" ry="7" transform="rotate(-30 54 54)" fill="#43A047" />
          <ellipse cx="106" cy="48" rx="12" ry="7" transform="rotate(30 106 48)" fill="#4CAF50" />
          <ellipse cx="70" cy="48" rx="10" ry="6" transform="rotate(-18 70 48)" fill="#66BB6A" />
          <ellipse cx="90" cy="48" rx="10" ry="6" transform="rotate(18 90 48)" fill="#66BB6A" />
          {/* Flower buds */}
          <circle cx="80" cy="31" r="7" fill="#F472B6" />
          <circle cx="80" cy="28" r="4.5" fill="#FBCFE8" />
          <circle cx="50" cy="49" r="5" fill="#FB7185" />
          <circle cx="110" cy="42" r="5" fill="#FB7185" />
        </g>
      )}

      {/* Level 6: Flourishing Bloom */}
      {level >= 6 && (
        <g className="plant-sway">
          <path d="M80 107C79 84 80 58 80 32" stroke="#164E29" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M80 84C65 76 54 64 46 50" stroke="#164E29" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M80 74C95 66 106 54 114 42" stroke="#164E29" strokeWidth="3.2" strokeLinecap="round" />
          <ellipse cx="58" cy="88" rx="14" ry="7.5" transform="rotate(-22 58 88)" fill="#15803D" />
          <ellipse cx="102" cy="86" rx="14" ry="7.5" transform="rotate(22 102 86)" fill="#15803D" />
          <ellipse cx="52" cy="58" rx="13" ry="7" transform="rotate(-35 52 58)" fill="#22C55E" />
          <ellipse cx="108" cy="52" rx="13" ry="7" transform="rotate(35 108 52)" fill="#22C55E" />
          <ellipse cx="67" cy="44" rx="11" ry="6" transform="rotate(-20 67 44)" fill="#4ADE80" />
          <ellipse cx="93" cy="44" rx="11" ry="6" transform="rotate(20 93 44)" fill="#4ADE80" />

          {/* Top Open Blossom */}
          <g transform="translate(80 27)">
            <circle cx="0" cy="-7" r="6" fill="#FB7185" />
            <circle cx="7" cy="-2" r="6" fill="#F472B6" />
            <circle cx="4" cy="6" r="6" fill="#FB7185" />
            <circle cx="-4" cy="6" r="6" fill="#F472B6" />
            <circle cx="-7" cy="-2" r="6" fill="#FB7185" />
            <circle cx="0" cy="0" r="4.5" fill="#FACC15" />
          </g>

          {/* Left Blossom */}
          <g transform="translate(45 48) scale(0.75)">
            <circle cx="0" cy="-6" r="5" fill="#FBBF24" />
            <circle cx="6" cy="0" r="5" fill="#F59E0B" />
            <circle cx="0" cy="6" r="5" fill="#FBBF24" />
            <circle cx="-6" cy="0" r="5" fill="#F59E0B" />
            <circle cx="0" cy="0" r="3.5" fill="#FFFBEB" />
          </g>

          {/* Right Blossom */}
          <g transform="translate(115 41) scale(0.75)">
            <circle cx="0" cy="-6" r="5" fill="#F472B6" />
            <circle cx="6" cy="0" r="5" fill="#EC4899" />
            <circle cx="0" cy="6" r="5" fill="#F472B6" />
            <circle cx="-6" cy="0" r="5" fill="#EC4899" />
            <circle cx="0" cy="0" r="3.5" fill="#FEF08A" />
          </g>
        </g>
      )}
    </svg>
  );
}

export function PlantGarden({ xp, streakDays, compact = false, onInspectGrowth }: PlantGardenProps) {
  const { current, next, progressPercent, xpNeededForNext } = getPlantStage(xp);

  if (compact) {
    return (
      <div className="bg-white border border-[#E5E8E3] rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <PlantIllustration level={current.level} size={84} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-[#526058] font-medium truncate">
              Lv.{current.level} · {current.nameKo} · 연속 {streakDays}일째
            </div>
            {onInspectGrowth && (
              <button
                type="button"
                onClick={onInspectGrowth}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 min-h-[32px] px-2"
              >
                성장 보기
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <p className="text-sm sm:text-base font-semibold text-[#14211A] truncate">
              {next ? `${next.nameKo}까지 ${xpNeededForNext} XP` : "최고 성장 단계 달성"}
            </p>
            <span className="text-xs font-mono tabular-nums text-[#526058] shrink-0">
              {xp} XP
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full bg-[#EDF1EC] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E8E3] rounded-3xl p-5 sm:p-7">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center justify-center bg-[#F7F9F7] border border-[#E5E8E3] rounded-2xl p-4 md:w-52 shrink-0">
          <PlantIllustration level={current.level} size={156} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#526058] font-medium">
            나의 영어 성장 식물 · Lv.{current.level} ({current.englishName}) · 연속 {streakDays}일 학습
          </div>
          <h3 className="mt-1.5 text-2xl font-bold text-[#14211A] tracking-tight">
            {current.nameKo}
          </h3>
          <p className="mt-1.5 text-sm text-[#526058] leading-relaxed">
            {current.messageKo}
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium text-[#526058] mb-2">
              <span>
                {next
                  ? `다음 단계 (${next.nameKo})까지 ${xpNeededForNext} XP 남음`
                  : "모든 식물 성장 단계를 완료했습니다"}
              </span>
              <span className="font-mono tabular-nums text-[#14211A] font-semibold">
                {xp} XP ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#EDF1EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6-Stage Roadmap */}
      <div className="mt-6 pt-5 border-t border-[#E5E8E3]">
        <div className="text-xs font-semibold text-[#526058] mb-3">
          식물 성장 로드맵
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PLANT_STAGES.map((stage) => {
            const reached = xp >= stage.minXp;
            const isCurrent = stage.level === current.level;
            return (
              <div
                key={stage.level}
                className={`rounded-xl p-3 border transition-colors ${
                  isCurrent
                    ? "bg-[#EFF6F0] border-emerald-600"
                    : reached
                      ? "bg-[#F8FAF8] border-[#D9E2DA]"
                      : "bg-white border-[#ECEFEA] opacity-65"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#526058]">
                  <span>Lv.{stage.level}</span>
                  <span>{stage.minXp} XP</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-[#14211A] truncate">
                  {stage.nameKo}
                </div>
                <div className="mt-0.5 text-[11px] text-[#526058]">
                  {isCurrent ? "현재 단계" : reached ? "달성 완료" : "성장 대기"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
