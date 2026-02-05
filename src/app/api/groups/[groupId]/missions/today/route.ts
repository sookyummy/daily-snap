import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("group_id", groupId)
    .eq("mission_date", today)
    .single();

  if (!mission) {
    return NextResponse.json({ mission: null });
  }

  // Get members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, users(id, nickname, profile_image)")
    .eq("group_id", groupId);

  // Get submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("mission_id", mission.id);

  const submissionMap = new Map(
    (submissions ?? []).map((s) => [s.user_id, s])
  );

  const memberStatuses = (members ?? []).map((m) => {
    const u = m.users as unknown as Record<string, unknown>;
    const sub = submissionMap.get(m.user_id);
    return {
      user_id: u?.id,
      nickname: u?.nickname,
      profile_image: u?.profile_image,
      submitted_at: sub?.submitted_at ?? null,
      // Only reveal photo if mission complete or it's the current user
      photo_url:
        mission.is_completed || m.user_id === profile.id
          ? sub?.photo_url ?? null
          : null,
      thumbnail_url:
        mission.is_completed || m.user_id === profile.id
          ? sub?.thumbnail_url ?? null
          : null,
    };
  });

  return NextResponse.json({
    mission: {
      ...mission,
      submissions: memberStatuses,
    },
  });
}
