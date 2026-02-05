import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push/send-notification";
import { getKSTDate } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = getKSTDate();
  let reminders = 0;

  // Get all active missions for today
  const { data: missions } = await supabase
    .from("missions")
    .select("id, group_id, keyword, emoji, is_completed")
    .eq("mission_date", today)
    .eq("is_completed", false);

  for (const mission of missions ?? []) {
    // Get group members
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", mission.group_id);

    // Get who already submitted
    const { data: submissions } = await supabase
      .from("submissions")
      .select("user_id")
      .eq("mission_id", mission.id);

    const submittedIds = new Set(
      (submissions ?? []).map((s) => s.user_id)
    );

    // Send reminder to those who haven't submitted
    for (const member of members ?? []) {
      if (!submittedIds.has(member.user_id)) {
        await sendPushToUser(supabase, member.user_id, {
          title: "아직 사진을 안 올렸어요! ⏰",
          body: `오늘의 미션: ${mission.keyword} ${mission.emoji || ""}. 내일 아침까지 시간이 얼마 안 남았어요!`,
          url: `/groups/${mission.group_id}`,
        });
        reminders++;
      }
    }
  }

  return NextResponse.json({ success: true, reminders });
}
