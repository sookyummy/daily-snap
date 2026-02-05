import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils/invite-code";
import {
  MAX_GROUP_NAME_LENGTH,
  MIN_GROUP_MEMBERS,
  MAX_GROUP_MEMBERS,
  INVITE_EXPIRY_HOURS,
} from "@/lib/constants";

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
  const { name, maxMembers = 4, missionMode = "auto" } = body;

  // Validate
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Group name max ${MAX_GROUP_NAME_LENGTH} chars` },
      { status: 400 }
    );
  }
  if (maxMembers < MIN_GROUP_MEMBERS || maxMembers > MAX_GROUP_MEMBERS) {
    return NextResponse.json(
      { error: `Members must be ${MIN_GROUP_MEMBERS}-${MAX_GROUP_MEMBERS}` },
      { status: 400 }
    );
  }
  if (!["auto", "manual"].includes(missionMode)) {
    return NextResponse.json(
      { error: "Invalid mission mode" },
      { status: 400 }
    );
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      max_members: maxMembers,
      mission_mode: missionMode,
      owner_id: profile.id,
      invite_code: inviteCode,
      invite_expires_at: expiresAt,
    })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }

  // Add creator as member
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: profile.id,
  });

  return NextResponse.json({
    id: group.id,
    name: group.name,
    inviteCode: group.invite_code,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${group.invite_code}`,
  });
}

export async function GET() {
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

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const groupIds = memberships?.map((m) => m.group_id) ?? [];

  if (groupIds.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds);

  return NextResponse.json({ groups: groups ?? [] });
}
