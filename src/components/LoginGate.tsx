import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { loginAccount } from "../utils/api.ts";
import { PlantIllustration } from "./PlantGarden.tsx";

interface LoginGateProps {
  onSuccess: (session: { username: string; token: string }) => void;
}

export function LoginGate({ onSuccess }: LoginGateProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const session = await loginAccount(username.trim(), password.trim());
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#14211A] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-[#E5E8E3] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          <PlantIllustration level={2} size={108} />
          <div className="mt-3 text-xs font-medium text-[#526058]">
            영어로 나무 키우기
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#14211A]">
            SproutEng
          </h1>
          <p className="mt-1.5 text-sm text-[#526058]">
            등록된 계정과 비밀번호를 입력해야 접속할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-id" className="block text-xs font-semibold text-[#14211A]">
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full min-h-[46px] rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] px-3.5 text-sm text-[#14211A] placeholder:text-[#8A978F] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-pw" className="block text-xs font-semibold text-[#14211A]">
              비밀번호
            </label>
            <div className="relative flex items-center">
              <input
                id="login-pw"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full min-h-[46px] rounded-xl border border-[#DCE1DA] bg-[#FAFBFA] pl-3.5 pr-12 text-sm text-[#14211A] placeholder:text-[#8A978F] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute right-1 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#526058] hover:text-[#14211A]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                접속하기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
