"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

        <HistoryFeed groupId={groupId} initialHistory={history} />
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
      <HistoryFeed groupId={groupId} initialHistory={history} />
    </div>
  );
}

function formatFeedDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function HistoryFeed({
  groupId,
  initialHistory,
}: {
  groupId: string;
  initialHistory: HistoryItem[];
}) {
  const [items, setItems] = useState<HistoryItem[]>(initialHistory);
  const [cursor, setCursor] = useState<string | null>(
    initialHistory.length >= 9
      ? initialHistory[initialHistory.length - 1].date
      : null
  );
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/missions?cursor=${cursor}&limit=20`
      );
      const data = await res.json();
      const newItems: HistoryItem[] = (data.missions ?? []).map(
        (m: { id: string; date: string; keyword: string; emoji: string | null; collageUrl: string | null; status: string }) => ({
          id: m.id,
          date: m.date,
          keyword: m.keyword,
          emoji: m.emoji,
          collageUrl: m.collageUrl,
          isCompleted: m.status === "completed",
        })
      );
      setItems((prev) => [...prev, ...newItems]);
      setCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, groupId]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Past Missions
      </h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {item.collageUrl ? (
              <Link href={`/groups/${groupId}/collage/${item.id}`}>
                <img
                  src={item.collageUrl}
                  alt={item.keyword}
                  className="w-full aspect-square object-cover"
                />
              </Link>
            ) : (
              <div className="flex aspect-[2/1] items-center justify-center bg-gray-50">
                <span className="text-5xl">{item.emoji || "📸"}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {item.emoji} {item.keyword}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFeedDate(item.date)}
                </p>
              </div>
              {item.isCompleted ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Done
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  Incomplete
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {cursor && (
        <div ref={loaderRef} className="flex justify-center py-6">
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-brand)]" />
          )}
        </div>
      )}
    </div>
  );
}
