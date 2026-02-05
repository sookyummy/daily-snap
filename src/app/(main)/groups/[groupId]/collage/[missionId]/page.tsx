"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type CollageData = {
  collageUrl: string | null;
  groupName: string;
  mission: { keyword: string; emoji: string | null; date: string };
  photos: Array<{
    userId: string;
    nickname: string;
    photoUrl: string;
    thumbnailUrl: string | null;
  }>;
};

export default function CollagePage() {
  const { groupId, missionId } = useParams<{
    groupId: string;
    missionId: string;
  }>();
  const router = useRouter();
  const [data, setData] = useState<CollageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollage() {
      const res = await fetch(
        `/api/groups/${groupId}/missions/${missionId}/collage`
      );
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    fetchCollage();
  }, [groupId, missionId]);

  const handleSave = () => {
    if (!data?.collageUrl) return;
    const a = document.createElement("a");
    a.href = data.collageUrl;
    a.download = `dailysnap-${data.mission.date}.jpg`;
    a.click();
  };

  const handleShare = async () => {
    if (!data?.collageUrl) return;

    if (navigator.share) {
      try {
        const response = await fetch(data.collageUrl);
        const blob = await response.blob();
        const file = new File([blob], `dailysnap-${data.mission.date}.jpg`, {
          type: "image/jpeg",
        });
        await navigator.share({
          title: `Daily Snap - ${data.mission.keyword}`,
          text: `${data.groupName}의 ${data.mission.date} 미션: ${data.mission.keyword} ${data.mission.emoji || ""}`,
          files: [file],
        });
      } catch {
        handleSave();
      }
    } else {
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-brand)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-gray-500">콜라주를 불러올 수 없습니다</p>
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
        <h1 className="pt-4 text-lg font-bold text-gray-900">
          {data.mission.keyword} {data.mission.emoji}
        </h1>
      </header>

      <div className="px-5 py-4">
        {/* Celebration */}
        <div className="mb-4 text-center">
          <div className="mb-1 text-3xl">🎉</div>
          <p className="text-sm text-gray-500">
            {data.mission.date} · {data.groupName}
          </p>
        </div>

        {/* Collage Image */}
        {data.collageUrl ? (
          <div className="mb-6 overflow-hidden rounded-2xl shadow-lg">
            <img
              src={data.collageUrl}
              alt="Collage"
              className="w-full"
            />
          </div>
        ) : (
          <div className="mb-6 flex aspect-square items-center justify-center rounded-2xl bg-gray-100">
            <p className="text-gray-400">콜라주 생성 중...</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]"
          >
            💾 저장
          </button>
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            📤 공유
          </button>
        </div>

        {/* Individual Photos */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            개별 사진
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {data.photos.map((photo) => (
              <div key={photo.userId} className="overflow-hidden rounded-xl">
                <div className="relative aspect-square">
                  <img
                    src={photo.thumbnailUrl || photo.photoUrl}
                    alt={photo.nickname}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs font-medium text-white">
                      {photo.nickname}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
