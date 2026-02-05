import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ groupId: string; missionId: string }> }
) {
  const { groupId, missionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .eq("group_id", groupId)
    .single();

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  if (!mission.is_completed) {
    return NextResponse.json(
      { error: "Mission not yet completed" },
      { status: 403 }
    );
  }

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("user_id, photo_url, thumbnail_url, users(nickname)")
    .eq("mission_id", missionId);

  return NextResponse.json({
    collageUrl: mission.collage_url,
    groupName: group?.name,
    mission: {
      keyword: mission.keyword,
      emoji: mission.emoji,
      date: mission.mission_date,
    },
    photos: (submissions ?? []).map((s) => ({
      userId: s.user_id,
      nickname: (s.users as unknown as Record<string, unknown>)?.nickname,
      photoUrl: s.photo_url,
      thumbnailUrl: s.thumbnail_url,
    })),
  });
}
