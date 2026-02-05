"use client";

import { useState, useEffect } from "react";
import { formatCountdown } from "@/lib/utils/date";
import PhotoUploader from "./PhotoUploader";
import Link from "next/link";

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

type HistoryItem = {
  id: string;
  date: string;
  keyword: string;
  emoji: string | null;
  collageUrl: string | null;
  isCompleted: boolean;
};

type Props = {
  groupId: string;
  mission: Mission | null;
  members: Member[];
  currentUserId: string;
  isCompleted: boolean;
  history?: HistoryItem[];
};

export default function MissionView({
  groupId,
  mission,
  members,
  currentUserId,
  isCompleted,
  history = [],
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

  const submittedCount = members.filter((m) => m.hasSubmitted).length;

  if (!mission) {
    return (
      <div className="px-5 py-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl">⏳</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            No mission yet today
          </h2>
          <p className="text-sm text-gray-500">
            A new mission starts every day at 10:00 AM
          </p>
        </div>

        {/* History Feed */}
        {history.length > 0 && (
          <HistoryFeed groupId={groupId} history={history} />
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {/* Mission Card with Actions */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5">
        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
          TODAY&apos;S MISSION
        </p>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{mission.emoji || "📸"}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {mission.keyword}
            </h2>
            {mission.description && (
              <p className="text-sm text-gray-600">{mission.description}</p>
            )}
          </div>
          <span className="text-xs text-gray-400">⏰ {countdown}</span>
        </div>

        {/* Action buttons inside mission card */}
        {isCompleted ? (
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-green-100 py-2.5 text-center text-sm font-semibold text-green-700">
              All done! 🎉
            </div>
            {mission.collage_url && (
              <Link
                href={`/groups/${groupId}/collage/${mission.id}`}
                className="flex-1 rounded-xl bg-[var(--color-brand)] py-2.5 text-center text-sm font-semibold text-white transition-all active:scale-[0.98]"
              >
                View Collage
              </Link>
            )}
          </div>
        ) : (
          <PhotoUploader
            groupId={groupId}
            missionId={mission.id}
            hasSubmitted={!!currentUserSubmitted}
          />
        )}
      </div>

      {/* Compact Member Status */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium ${
                member.hasSubmitted
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
              title={`${member.nickname}${member.hasSubmitted ? " ✓" : ""}`}
            >
              {member.nickname.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {submittedCount}/{members.length} submitted
        </span>
      </div>

      {/* History Feed */}
      {history.length > 0 && (
        <HistoryFeed groupId={groupId} history={history} />
      )}
    </div>
  );
}

function HistoryFeed({
  groupId,
  history,
}: {
  groupId: string;
  history: HistoryItem[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Past Missions</h3>
        <Link
          href={`/groups/${groupId}/history`}
          className="text-xs text-[var(--color-brand)]"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {history.map((item) => (
          <Link
            key={item.id}
            href={
              item.isCompleted && item.collageUrl
                ? `/groups/${groupId}/collage/${item.id}`
                : `/groups/${groupId}/history`
            }
            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
          >
            {item.collageUrl ? (
              <img
                src={item.collageUrl}
                alt={item.keyword}
                className="h-full w-full object-cover transition-transform group-active:scale-95"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                {item.emoji || "📸"}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
              <p className="text-[10px] font-medium text-white/80">
                {item.date.slice(5)}
              </p>
              <p className="truncate text-xs font-semibold text-white">
                {item.keyword}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
