import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PushPermissionBanner from "@/components/push/PushPermissionBanner";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's public profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, nickname")
    .eq("auth_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get user's groups with today's mission info
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const groupIds = memberships?.map((m) => m.group_id) ?? [];

  let groups: Array<{
    id: string;
    name: string;
    max_members: number;
    member_count: number;
    today_mission: { keyword: string; emoji: string | null } | null;
    today_progress: { completed: number; total: number };
    is_today_completed: boolean;
  }> = [];

  if (groupIds.length > 0) {
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    const today = new Date().toISOString().split("T")[0];

    groups = await Promise.all(
      (groupData ?? []).map(async (group) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id);

        // Get today's mission
        const { data: mission } = await supabase
          .from("missions")
          .select("*")
          .eq("group_id", group.id)
          .eq("mission_date", today)
          .single();

        // Get submission count for today
        let completedCount = 0;
        if (mission) {
          const { count } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("mission_id", mission.id);
          completedCount = count ?? 0;
        }

        return {
          id: group.id,
          name: group.name,
          max_members: group.max_members,
          member_count: memberCount ?? 0,
          today_mission: mission
            ? { keyword: mission.keyword, emoji: mission.emoji }
            : null,
          today_progress: {
            completed: completedCount,
            total: memberCount ?? 0,
          },
          is_today_completed: mission?.is_completed ?? false,
        };
      })
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-safe-top">
        <h1 className="pt-4 text-2xl font-bold text-gray-900">Daily Snap</h1>
        <Link
          href="/groups/new"
          className="mt-4 flex h-9 items-center gap-1 rounded-full bg-[var(--color-brand)] px-4 text-sm font-semibold text-white transition-all active:scale-95"
        >
          + 그룹
        </Link>
      </header>

      {/* Push Permission */}
      <PushPermissionBanner />

      {/* Group List */}
      <main className="flex-1 px-5 py-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">📷</div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              아직 참여한 그룹이 없어요
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              그룹을 만들거나 초대 링크로 참여해보세요
            </p>
            <Link
              href="/groups/new"
              className="rounded-xl bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all active:scale-95"
            >
              첫 그룹 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {group.is_today_completed ? "✅" : "🟡"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {group.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.member_count}/{group.max_members}명
                  </span>
                </div>

                {group.today_mission ? (
                  <>
                    <p className="mb-1.5 text-sm text-gray-600">
                      오늘의 미션:{" "}
                      <span className="font-medium">
                        {group.today_mission.keyword}{" "}
                        {group.today_mission.emoji}
                      </span>
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand)] transition-all"
                          style={{
                            width: `${group.today_progress.total > 0 ? (group.today_progress.completed / group.today_progress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="ml-3 text-xs text-gray-500">
                        {group.is_today_completed
                          ? "완료!"
                          : `${group.today_progress.completed}/${group.today_progress.total}명`}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    오늘의 미션이 아직 없어요
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
