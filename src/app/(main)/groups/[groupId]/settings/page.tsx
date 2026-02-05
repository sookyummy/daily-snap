"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INVITE_EXPIRY_HOURS } from "@/lib/constants";
import { generateInviteCode } from "@/lib/utils/invite-code";

type Member = {
  id: string;
  nickname: string;
  profile_image: string | null;
  isOwner: boolean;
};

type GroupInfo = {
  id: string;
  name: string;
  max_members: number;
  mission_mode: string;
  owner_id: string;
  invite_code: string;
};

export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      setGroup(data);
      setMembers(data.members ?? []);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        setCurrentUserId(profile?.id ?? null);
      }
    }
    fetchData();
  }, [groupId]);

  const isOwner = currentUserId === group?.owner_id;

  const handleCopyInvite = async () => {
    if (!group) return;
    const link = `${window.location.origin}/invite/${group.invite_code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveGroup = async () => {
    if (!confirm("정말 그룹을 나가시겠습니까?")) return;
    const supabase = createClient();
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", currentUserId!);
    router.push("/home");
  };

  if (!group) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center gap-3 px-5 pb-2 pt-safe-top">
        <button
          onClick={() => router.back()}
          className="pt-4 text-lg text-gray-500"
        >
          ←
        </button>
        <h1 className="pt-4 text-lg font-bold text-gray-900">그룹 설정</h1>
      </header>

      <div className="px-5 py-4 space-y-6">
        {/* Group Info */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            그룹 정보
          </h2>
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">이름</span>
              <span className="text-sm font-medium text-gray-900">
                {group.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">미션 모드</span>
              <span className="text-sm font-medium text-gray-900">
                {group.mission_mode === "auto" ? "자동" : "직접 설정"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">최대 인원</span>
              <span className="text-sm font-medium text-gray-900">
                {group.max_members}명
              </span>
            </div>
          </div>
        </div>

        {/* Invite Link */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            초대 링크
          </h2>
          <button
            onClick={handleCopyInvite}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-all active:scale-[0.98]"
          >
            {copied ? "복사됨! ✓" : "초대 링크 복사"}
          </button>
        </div>

        {/* Members */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            멤버 ({members.length}/{group.max_members})
          </h2>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {member.profile_image ? (
                    <img
                      src={member.profile_image}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {member.nickname}
                    {member.id === currentUserId && (
                      <span className="ml-1 text-gray-400">(나)</span>
                    )}
                  </p>
                </div>
                {member.isOwner && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                    👑 방장
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* History link */}
        <a
          href={`/groups/${groupId}/history`}
          className="block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-medium text-gray-700 transition-all active:scale-[0.98]"
        >
          미션 히스토리 보기
        </a>

        {/* Leave Group */}
        {!isOwner && (
          <button
            onClick={handleLeaveGroup}
            className="w-full rounded-xl py-3 text-sm font-medium text-red-500"
          >
            그룹 나가기
          </button>
        )}
      </div>
    </div>
  );
}
