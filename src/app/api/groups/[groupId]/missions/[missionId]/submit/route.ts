import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processUploadedPhoto } from "@/lib/utils/image";
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { generateCollage } from "@/lib/collage/generate";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ groupId: string; missionId: string }> }
) {
  const { groupId, missionId } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, nickname")
    .eq("auth_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Verify group membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", profile.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  // Verify mission exists and is active
  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .eq("group_id", groupId)
    .single();

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  if (new Date(mission.deadline) < new Date()) {
    return NextResponse.json({ error: "미션이 마감되었습니다" }, { status: 410 });
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("photo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  }

  // Validate file
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "지원하지 않는 이미지 형식입니다" },
      { status: 400 }
    );
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "10MB 이하의 사진만 업로드할 수 있습니다" },
      { status: 400 }
    );
  }

  // Process image
  const buffer = Buffer.from(await file.arrayBuffer());
  const { original, thumbnail } = await processUploadedPhoto(buffer);

  // Upload to storage
  const photoPath = `${missionId}/${profile.id}.jpg`;
  const thumbPath = `${missionId}/${profile.id}_thumb.jpg`;

  await adminSupabase.storage
    .from("photos")
    .upload(photoPath, original, {
      contentType: "image/jpeg",
      upsert: true,
    });

  await adminSupabase.storage
    .from("thumbnails")
    .upload(thumbPath, thumbnail, {
      contentType: "image/jpeg",
      upsert: true,
    });

  const {
    data: { publicUrl: photoUrl },
  } = adminSupabase.storage.from("photos").getPublicUrl(photoPath);

  const {
    data: { publicUrl: thumbnailUrl },
  } = adminSupabase.storage.from("thumbnails").getPublicUrl(thumbPath);

  // Upsert submission
  const { data: existingSub } = await supabase
    .from("submissions")
    .select("id")
    .eq("mission_id", missionId)
    .eq("user_id", profile.id)
    .single();

  if (existingSub) {
    await adminSupabase
      .from("submissions")
      .update({
        photo_url: photoUrl,
        thumbnail_url: thumbnailUrl,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);
  } else {
    await adminSupabase.from("submissions").insert({
      mission_id: missionId,
      user_id: profile.id,
      photo_url: photoUrl,
      thumbnail_url: thumbnailUrl,
    });
  }

  // Check if all members have submitted
  const { count: memberCount } = await adminSupabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { count: submissionCount } = await adminSupabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("mission_id", missionId);

  const isGroupCompleted = (submissionCount ?? 0) >= (memberCount ?? 0);

  if (isGroupCompleted && !mission.is_completed) {
    // Generate collage
    try {
      const { data: allSubs } = await adminSupabase
        .from("submissions")
        .select("user_id, photo_url")
        .eq("mission_id", missionId);

      const { data: allMembers } = await adminSupabase
        .from("group_members")
        .select("user_id, users(nickname)")
        .eq("group_id", groupId);

      const memberMap = new Map(
        (allMembers ?? []).map((m) => [
          m.user_id,
          (m.users as unknown as Record<string, unknown>)?.nickname as string,
        ])
      );

      const { data: group } = await adminSupabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      // Download all photos
      const photos = await Promise.all(
        (allSubs ?? []).map(async (sub) => {
          const path = `${missionId}/${sub.user_id}.jpg`;
          const { data } = await adminSupabase.storage
            .from("photos")
            .download(path);
          const buf = data
            ? Buffer.from(await data.arrayBuffer())
            : Buffer.alloc(0);
          return {
            buffer: buf,
            nickname: memberMap.get(sub.user_id) ?? "Unknown",
          };
        })
      );

      const date = new Date(mission.mission_date);
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

      const collageBuffer = await generateCollage({
        photos,
        keyword: mission.keyword,
        emoji: mission.emoji || "📸",
        date: dateStr,
        groupName: group?.name || "Daily Snap",
      });

      // Upload collage
      const collagePath = `${groupId}/${mission.mission_date}.jpg`;
      await adminSupabase.storage
        .from("collages")
        .upload(collagePath, collageBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      const {
        data: { publicUrl: collageUrl },
      } = adminSupabase.storage.from("collages").getPublicUrl(collagePath);

      // Update mission as completed
      await adminSupabase
        .from("missions")
        .update({ is_completed: true, collage_url: collageUrl })
        .eq("id", missionId);
    } catch (err) {
      console.error("Collage generation failed:", err);
      // Still mark as completed even if collage fails
      await adminSupabase
        .from("missions")
        .update({ is_completed: true })
        .eq("id", missionId);
    }
  }

  return NextResponse.json({
    submissionId: existingSub?.id ?? "new",
    isGroupCompleted,
    message: isGroupCompleted
      ? "🎉 모두 완료! 콜라주가 생성되었습니다"
      : `업로드 완료! ${(memberCount ?? 0) - (submissionCount ?? 0)}명이 아직 참여하지 않았어요`,
  });
}
