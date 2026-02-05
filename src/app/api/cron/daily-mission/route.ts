import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assignMission } from "@/lib/missions/assign";
import { getKSTDate } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = getKSTDate();

  // Get all groups that have at least 2 members
  const { data: groups } = await supabase.from("groups").select("id, mission_mode");

  let created = 0;
  let skipped = 0;

  for (const group of groups ?? []) {
    // Check member count
    const { count: memberCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    if ((memberCount ?? 0) < 1) {
      skipped++;
      continue;
    }

    // Check if mission already exists for today
    const { data: existing } = await supabase
      .from("missions")
      .select("id")
      .eq("group_id", group.id)
      .eq("mission_date", today)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    // For manual mode, check if owner pre-scheduled a mission
    // If not scheduled, fall back to auto
    const mission = await assignMission(supabase, group.id, today);
    if (mission) created++;
  }

  return NextResponse.json({
    success: true,
    date: today,
    created,
    skipped,
  });
}
