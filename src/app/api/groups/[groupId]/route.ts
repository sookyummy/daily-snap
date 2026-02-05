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

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Get members with user info
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, joined_at, users(id, nickname, profile_image)")
    .eq("group_id", groupId);

  return NextResponse.json({
    ...group,
    members:
      members?.map((m) => ({
        ...(m.users as unknown as Record<string, unknown>),
        isOwner: (m.users as unknown as Record<string, unknown>)?.id === group.owner_id,
        joinedAt: m.joined_at,
      })) ?? [],
  });
}
