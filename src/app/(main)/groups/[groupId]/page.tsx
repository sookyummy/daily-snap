import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MissionView from "@/components/mission/MissionView";
import InviteSheet from "@/components/groups/InviteSheet";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ invite?: string }>;
};

export default async function GroupDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { groupId } = await params;
  const { invite } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get group
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) redirect("/home");

  // Get members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, users(id, nickname, profile_image)")
    .eq("group_id", groupId);

  // Get today's mission
  const today = new Date().toISOString().split("T")[0];
  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("group_id", groupId)
    .eq("mission_date", today)
    .single();

  // Get submissions for today's mission
  let submissions: Array<{
    user_id: string;
    submitted_at: string | null;
    photo_url: string | null;
    thumbnail_url: string | null;
  }> = [];

  if (mission) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("user_id, submitted_at, photo_url, thumbnail_url")
      .eq("mission_id", mission.id);
    submissions = subs ?? [];
  }

  const memberList =
    members?.map((m) => {
      const u = m.users as unknown as Record<string, unknown>;
      const sub = submissions.find((s) => s.user_id === u?.id);
      return {
        id: u?.id as string,
        nickname: u?.nickname as string,
        profile_image: u?.profile_image as string | null,
        isOwner: u?.id === group.owner_id,
        hasSubmitted: !!sub,
        submittedAt: sub?.submitted_at ?? null,
        // Only show photo URL if mission is completed or it's the current user
        photoUrl:
          mission?.is_completed || u?.id === profile.id
            ? sub?.photo_url ?? null
            : null,
        thumbnailUrl:
          mission?.is_completed || u?.id === profile.id
            ? sub?.thumbnail_url ?? null
            : null,
      };
    }) ?? [];

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-safe-top">
        <div className="flex items-center gap-3 pt-4">
          <a href="/home" className="text-lg text-gray-500">
            ←
          </a>
          <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
        </div>
        <a
          href={`/groups/${groupId}/settings`}
          className="pt-4 text-gray-400"
        >
          ⚙️
        </a>
      </header>

      {/* Mission Content */}
      <MissionView
        groupId={groupId}
        mission={mission}
        members={memberList}
        currentUserId={profile.id}
        isCompleted={mission?.is_completed ?? false}
      />

      {/* Invite Sheet (shown after group creation) */}
      {invite === "true" && (
        <InviteSheet
          inviteCode={group.invite_code}
          groupName={group.name}
          memberCount={memberList.length}
          maxMembers={group.max_members}
        />
      )}
    </div>
  );
}
