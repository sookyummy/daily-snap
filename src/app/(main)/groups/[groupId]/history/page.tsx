"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type MissionSummary = {
  id: string;
  date: string;
  keyword: string;
  emoji: string | null;
  status: "completed" | "in_progress" | "incomplete";
  completedCount: number;
  totalCount: number;
  collageUrl: string | null;
};

export default function HistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const res = await fetch(
        `/api/groups/${groupId}/missions?month=${currentMonth}`
      );
      const data = await res.json();
      setMissions(data.missions ?? []);
      setLoading(false);
    }
    fetchHistory();
  }, [groupId, currentMonth]);

  const [year, month] = currentMonth.split("-").map(Number);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  // Build calendar data
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const missionMap = new Map(missions.map((m) => [m.date, m]));

  const statusDot = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-400";
      case "in_progress":
        return "bg-yellow-400";
      case "incomplete":
        return "bg-red-400";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center gap-3 px-5 pb-2 pt-safe-top">
        <button
          onClick={() => router.back()}
          className="pt-4 text-lg text-gray-500"
        >
          ←
        </button>
        <h1 className="pt-4 text-lg font-bold text-gray-900">Mission History</h1>
      </header>

      {/* Calendar */}
      <div className="px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-gray-500">
            ←
          </button>
          <span className="font-semibold text-gray-900">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 text-gray-500">
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 text-center text-xs text-gray-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const mission = missionMap.get(dateStr);
            return (
              <div key={day} className="flex flex-col items-center py-1">
                <span className="text-xs text-gray-700">{day}</span>
                {mission && (
                  <div
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${statusDot(mission.status)}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission List */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-brand)]" />
          </div>
        ) : missions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No missions this month
          </p>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="rounded-xl border border-gray-100 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">
                      {mission.date}
                    </span>
                    <p className="font-medium text-gray-900">
                      {mission.keyword} {mission.emoji}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      mission.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : mission.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {mission.status === "completed"
                      ? "Done"
                      : mission.status === "in_progress"
                        ? "In Progress"
                        : "Incomplete"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {mission.completedCount}/{mission.totalCount} participated
                  </span>
                  {mission.status === "completed" && mission.collageUrl && (
                    <Link
                      href={`/groups/${groupId}/collage/${mission.id}`}
                      className="text-xs font-medium text-[var(--color-brand)]"
                    >
                      View Collage →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
