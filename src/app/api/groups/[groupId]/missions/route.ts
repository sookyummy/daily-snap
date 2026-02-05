import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
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

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // 'YYYY-MM'

  let query = supabase
    .from("missions")
    .select("*")
    .eq("group_id", groupId)
    .order("mission_date", { ascending: false });

  if (month) {
    const startDate = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const endDate = new Date(year, mon, 0).toISOString().split("T")[0];
    query = query.gte("mission_date", startDate).lte("mission_date", endDate);
  }

  const { data: missions } = await query;

  // Get member count for the group
  const { count: memberCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  // Get submission counts for each mission
  const missionIds = (missions ?? []).map((m) => m.id);
  let submissionCounts: Record<string, number> = {};

  if (missionIds.length > 0) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("mission_id")
      .in("mission_id", missionIds);

    for (const sub of subs ?? []) {
      submissionCounts[sub.mission_id] =
        (submissionCounts[sub.mission_id] || 0) + 1;
    }
  }

  const result = (missions ?? []).map((m) => ({
    id: m.id,
    date: m.mission_date,
    keyword: m.keyword,
    emoji: m.emoji,
    status: m.is_completed
      ? "completed"
      : new Date(m.deadline) > new Date()
        ? "in_progress"
        : "incomplete",
    completedCount: submissionCounts[m.id] || 0,
    totalCount: memberCount ?? 0,
    collageUrl: m.collage_url,
  }));

  return NextResponse.json({ missions: result });
}
