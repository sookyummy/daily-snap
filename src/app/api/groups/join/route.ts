import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  // Find group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    return NextResponse.json(
      { error: "유효하지 않은 초대 링크입니다" },
      { status: 404 }
    );
  }

  // Check expiry
  if (
    group.invite_expires_at &&
    new Date(group.invite_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "초대 링크가 만료되었습니다" },
      { status: 410 }
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", profile.id)
    .single();

  if (existing) {
    return NextResponse.json({
      groupId: group.id,
      name: group.name,
      message: "이미 참여 중인 그룹입니다",
    });
  }

  // Check member count
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) >= group.max_members) {
    return NextResponse.json(
      { error: "그룹 인원이 가득 찼습니다" },
      { status: 409 }
    );
  }

  // Join
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: profile.id });

  if (joinError) {
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    groupId: group.id,
    name: group.name,
    message: "그룹에 참여했습니다!",
  });
}
