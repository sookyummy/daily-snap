import { SupabaseClient } from "@supabase/supabase-js";
import { MISSION_POOL } from "./pool";
import { getKSTMissionStart, getKSTMissionDeadline } from "@/lib/utils/date";
import type { MissionPoolItem } from "@/types";

export async function assignMission(
  supabase: SupabaseClient,
  groupId: string,
  missionDate: string
) {
  // Get recent 7 days of missions for this group
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMissions } = await supabase
    .from("missions")
    .select("keyword, emoji")
    .eq("group_id", groupId)
    .gte("mission_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("mission_date", { ascending: false });

  const recentKeywords = new Set(
    recentMissions?.map((m) => m.keyword) ?? []
  );

  // Get last 2 days' categories to avoid 3+ consecutive same category
  const { data: lastTwoMissions } = await supabase
    .from("missions")
    .select("keyword")
    .eq("group_id", groupId)
    .order("mission_date", { ascending: false })
    .limit(2);

  const lastTwoCategories = (lastTwoMissions ?? []).map((m) => {
    const poolItem = MISSION_POOL.find((p) => p.keyword === m.keyword);
    return poolItem?.category;
  });

  // Filter available missions
  let available = MISSION_POOL.filter((m) => !recentKeywords.has(m.keyword));

  // If same category used last 2 days, exclude that category
  if (
    lastTwoCategories.length >= 2 &&
    lastTwoCategories[0] === lastTwoCategories[1] &&
    lastTwoCategories[0]
  ) {
    const excludeCategory = lastTwoCategories[0];
    const filtered = available.filter((m) => m.category !== excludeCategory);
    if (filtered.length > 0) {
      available = filtered;
    }
  }

  // If all were used recently, reset and use full pool
  if (available.length === 0) {
    available = [...MISSION_POOL];
  }

  // Random select
  const selected: MissionPoolItem =
    available[Math.floor(Math.random() * available.length)];

  // Insert mission
  const { data: mission, error } = await supabase
    .from("missions")
    .insert({
      group_id: groupId,
      keyword: selected.keyword,
      emoji: selected.emoji,
      description: selected.description,
      mission_date: missionDate,
      started_at: getKSTMissionStart(missionDate),
      deadline: getKSTMissionDeadline(missionDate),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to assign mission:", error);
    return null;
  }

  return mission;
}
