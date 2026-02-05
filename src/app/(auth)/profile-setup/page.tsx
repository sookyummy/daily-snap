"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MIN_NICKNAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  NICKNAME_REGEX,
} from "@/lib/constants";

export default function ProfileSetupPage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateNickname = (value: string): string => {
    if (value.length < MIN_NICKNAME_LENGTH)
      return `최소 ${MIN_NICKNAME_LENGTH}자 이상 입력해주세요`;
    if (value.length > MAX_NICKNAME_LENGTH)
      return `최대 ${MAX_NICKNAME_LENGTH}자까지 가능합니다`;
    if (!NICKNAME_REGEX.test(value))
      return "한글, 영문, 숫자, 언더스코어만 사용 가능합니다";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          nickname,
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_id", user.id);

      if (updateError) {
        setError("저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      router.push("/home");
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">👤</div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">
            프로필 설정
          </h1>
          <p className="text-sm text-gray-500">
            Daily Snap에서 사용할 닉네임을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              placeholder="snap_lover"
              maxLength={MAX_NICKNAME_LENGTH}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {MIN_NICKNAME_LENGTH}-{MAX_NICKNAME_LENGTH}자, 한글/영문/숫자
              </span>
              <span className="text-xs text-gray-400">
                {nickname.length}/{MAX_NICKNAME_LENGTH}
              </span>
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || nickname.length < MIN_NICKNAME_LENGTH}
            className="w-full rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-brand-dark)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "저장 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
