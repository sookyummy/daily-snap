"use client";

import { useState } from "react";

type Props = {
  inviteCode: string;
  groupName: string;
  memberCount: number;
  maxMembers: number;
};

export default function InviteSheet({
  inviteCode,
  groupName,
  memberCount,
  maxMembers,
}: Props) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/invite/${inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daily Snap - ${groupName}`,
          text: `"${groupName}" 그룹에 초대합니다! 매일 사진 미션을 함께 해요 📸`,
          url: inviteLink,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">친구 초대</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          초대 링크를 공유해서 친구들을 초대하세요
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="flex-1 truncate text-sm text-gray-600">
            {inviteLink}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors"
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 rounded-xl bg-[var(--color-brand)] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            공유하기
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]"
          >
            링크 복사
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          현재 {memberCount}/{maxMembers}명 · 48시간 내 유효
        </p>
      </div>
    </div>
  );
}
