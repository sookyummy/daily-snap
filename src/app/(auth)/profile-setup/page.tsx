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
      return `Minimum ${MIN_NICKNAME_LENGTH} characters`;
    if (value.length > MAX_NICKNAME_LENGTH)
      return `Maximum ${MAX_NICKNAME_LENGTH} characters`;
    if (!NICKNAME_REGEX.test(value))
      return "Only letters, numbers, and underscores allowed";
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
        setError("Failed to save. Please try again.");
        return;
      }

      router.push("/home");
    } catch {
      setError("An error occurred.");
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
            Profile Setup
          </h1>
          <p className="text-sm text-gray-500">
            Choose a nickname to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Nickname
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
                {MIN_NICKNAME_LENGTH}-{MAX_NICKNAME_LENGTH}, Letters/Numbers
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
            {loading ? "Saving..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
