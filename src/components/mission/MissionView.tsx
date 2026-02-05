"use client";

import { useState, useEffect } from "react";
import { formatCountdown } from "@/lib/utils/date";
import PhotoUploader from "./PhotoUploader";

type Member = {
  id: string;
  nickname: string;
  profile_image: string | null;
  isOwner: boolean;
  hasSubmitted: boolean;
  submittedAt: string | null;
  photoUrl: string | null;
  thumbnailUrl: string | null;
};

type Mission = {
  id: string;
  keyword: string;
  emoji: string | null;
  description: string | null;
  deadline: string;
  is_completed: boolean;
  collage_url: string | null;
};

type Props = {
  groupId: string;
  mission: Mission | null;
  members: Member[];
  currentUserId: string;
  isCompleted: boolean;
};

export default function MissionView({
  groupId,
  mission,
  members,
  currentUserId,
  isCompleted,
}: Props) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!mission) return;
    const update = () => setCountdown(formatCountdown(mission.deadline));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [mission]);

  const currentUserSubmitted = members.find(
    (m) => m.id === currentUserId
  )?.hasSubmitted;

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          오늘의 미션이 아직 없어요
        </h2>
        <p className="text-sm text-gray-500">
          매일 오전 10시에 새로운 미션이 시작됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {/* Mission Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 text-center">
        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
          오늘의 미션
        </p>
        <div className="mb-2 text-4xl">{mission.emoji || "📸"}</div>
        <h2 className="mb-1 text-2xl font-bold text-gray-900">
          {mission.keyword}
        </h2>
        {mission.description && (
          <p className="text-sm text-gray-600">{mission.description}</p>
        )}
        <p className="mt-3 text-xs text-gray-400">⏰ {countdown}</p>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="mb-6 rounded-2xl bg-green-50 p-4 text-center">
          <div className="mb-1 text-2xl">🎉</div>
          <p className="font-semibold text-green-800">모두 완료!</p>
          {mission.collage_url && (
            <a
              href={`/groups/${groupId}/collage/${mission.id}`}
              className="mt-2 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              콜라주 보기
            </a>
          )}
        </div>
      )}

      {/* Member Grid */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          참여 현황 ({members.filter((m) => m.hasSubmitted).length}/
          {members.length})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
            >
              {/* Photo area */}
              <div className="aspect-square flex items-center justify-center">
                {member.hasSubmitted && (member.thumbnailUrl || member.photoUrl) ? (
                  <img
                    src={member.thumbnailUrl || member.photoUrl!}
                    alt={member.nickname}
                    className="h-full w-full object-cover"
                  />
                ) : member.hasSubmitted ? (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <span className="text-3xl">✅</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <span className="text-3xl">⏳</span>
                  </div>
                )}
              </div>
              {/* Name tag */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs font-medium text-white">
                  {member.nickname}
                  {member.isOwner ? " 👑" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      {!isCompleted && (
        <PhotoUploader
          groupId={groupId}
          missionId={mission.id}
          hasSubmitted={!!currentUserSubmitted}
        />
      )}
    </div>
  );
}
