"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GroupInfo = {
  name: string;
  max_members: number;
  member_count: number;
};

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      // Fetch group info
      const { data } = await supabase
        .from("groups")
        .select("name, max_members")
        .eq("invite_code", code)
        .single();

      if (data) {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq(
            "group_id",
            (
              await supabase
                .from("groups")
                .select("id")
                .eq("invite_code", code)
                .single()
            ).data?.id ?? ""
          );

        setGroup({
          name: data.name,
          max_members: data.max_members,
          member_count: count ?? 0,
        });
      } else {
        setError("유효하지 않은 초대 링크입니다");
      }
      setLoading(false);
    }

    checkAuth();
  }, [code]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      // Store invite code and redirect to login
      localStorage.setItem("pendingInviteCode", code);
      router.push("/login");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "참여에 실패했습니다");
        return;
      }

      router.push(`/groups/${data.groupId}`);
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs text-center">
        {error ? (
          <>
            <div className="mb-4 text-5xl">😢</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900">{error}</h1>
            <button
              onClick={() => router.push("/home")}
              className="mt-6 rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700"
            >
              홈으로 가기
            </button>
          </>
        ) : group ? (
          <>
            <div className="mb-4 text-5xl">📸</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              그룹 초대
            </h1>
            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-lg font-semibold text-gray-900">
                {group.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {group.member_count}/{group.max_members}명 참여 중
              </p>
            </div>

            {group.member_count >= group.max_members ? (
              <p className="text-sm text-red-500">인원이 가득 찼습니다</p>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {joining
                  ? "참여 중..."
                  : isLoggedIn
                    ? "참여하기"
                    : "로그인하고 참여하기"}
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
