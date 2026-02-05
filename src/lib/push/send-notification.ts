import webpush from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey || publicKey.length < 20) return false;
  try {
    webpush.setVapidDetails("mailto:hello@dailysnap.app", publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
}

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
) {
  if (!ensureVapid()) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) {
        // Subscription expired, clean up
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }
}

export async function sendPushToGroupMembers(
  supabase: SupabaseClient,
  groupId: string,
  payload: PushPayload,
  excludeUserIds?: string[]
) {
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  for (const member of members ?? []) {
    if (excludeUserIds?.includes(member.user_id)) continue;
    await sendPushToUser(supabase, member.user_id, payload);
  }
}
