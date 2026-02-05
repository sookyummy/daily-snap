import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_NICKNAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  NICKNAME_REGEX,
} from "@/lib/constants";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname } = body;

  if (!nickname || typeof nickname !== "string") {
    return NextResponse.json(
      { error: "Nickname is required" },
      { status: 400 }
    );
  }

  if (
    nickname.length < MIN_NICKNAME_LENGTH ||
    nickname.length > MAX_NICKNAME_LENGTH
  ) {
    return NextResponse.json(
      { error: `Nickname must be ${MIN_NICKNAME_LENGTH}-${MAX_NICKNAME_LENGTH} characters` },
      { status: 400 }
    );
  }

  if (!NICKNAME_REGEX.test(nickname)) {
    return NextResponse.json(
      { error: "Invalid nickname format" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      nickname,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_id", user.id)
    .select("id, nickname, profile_image, is_profile_complete")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, profile_image, is_profile_complete")
    .eq("auth_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
