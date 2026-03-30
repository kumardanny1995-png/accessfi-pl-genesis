import "server-only";

import webpush, { type PushSubscription } from "web-push";

import {
  getAppUrl,
  getWebPushPrivateKey,
  getWebPushPublicKey,
  getWebPushSubject,
  isWebPushConfigured
} from "@/lib/db/env";
import { getSupabaseAdmin } from "@/lib/db/supabase";

type PushableNotification = {
  guestProfileId: string;
  title: string;
  body: string;
  href?: string | null;
  type: string;
};

let vapidReady = false;

function ensureWebPushClient() {
  if (!isWebPushConfigured()) {
    return false;
  }

  if (!vapidReady) {
    webpush.setVapidDetails(getWebPushSubject()!, getWebPushPublicKey()!, getWebPushPrivateKey()!);
    vapidReady = true;
  }

  return true;
}

function buildNotificationUrl(href?: string | null) {
  return new URL(href ?? "/", getAppUrl()).toString();
}

function toStoredSubscription(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
  };
}

export async function upsertWebPushSubscription(args: {
  guestProfileId: string;
  subscription: PushSubscription;
  userAgent?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const payload = toStoredSubscription(args.subscription);

  const { error } = await supabase.from("web_push_subscriptions").upsert(
    {
      guest_profile_id: args.guestProfileId,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      subscription_json: payload,
      user_agent: args.userAgent ?? null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
      failed_at: null,
      failure_reason: null
    },
    {
      onConflict: "endpoint"
    }
  );

  if (error) {
    throw error;
  }
}

export async function deactivateWebPushSubscription(args: {
  guestProfileId: string;
  endpoint: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("web_push_subscriptions")
    .update({
      is_active: false,
      failed_at: new Date().toISOString(),
      failure_reason: "Unsubscribed from browser"
    })
    .eq("guest_profile_id", args.guestProfileId)
    .eq("endpoint", args.endpoint);

  if (error) {
    throw error;
  }
}

export async function sendWebPushNotifications(notifications: PushableNotification[]) {
  if (!ensureWebPushClient() || notifications.length === 0) {
    return { delivered: 0, failed: 0, skipped: notifications.length };
  }

  const supabase = getSupabaseAdmin();
  const guestProfileIds = [...new Set(notifications.map((item) => item.guestProfileId))];
  const { data: subscriptions, error } = await supabase
    .from("web_push_subscriptions")
    .select("id, guest_profile_id, endpoint, p256dh, auth, failure_count")
    .in("guest_profile_id", guestProfileIds)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const subscriptionsByGuest = new Map<string, Array<(typeof subscriptions)[number]>>();
  for (const subscription of subscriptions ?? []) {
    const list = subscriptionsByGuest.get(subscription.guest_profile_id) ?? [];
    list.push(subscription);
    subscriptionsByGuest.set(subscription.guest_profile_id, list);
  }

  const deliveries = await Promise.allSettled(
    notifications.flatMap((notification) =>
      (subscriptionsByGuest.get(notification.guestProfileId) ?? []).map(async (subscription) => {
        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          url: buildNotificationUrl(notification.href),
          tag: `lockscore:${notification.type}`,
          icon: `${getAppUrl()}/icon`,
          badge: `${getAppUrl()}/icon`
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: null,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        );

        await supabase
          .from("web_push_subscriptions")
          .update({
            last_seen_at: new Date().toISOString(),
            last_notified_at: new Date().toISOString(),
            failure_count: 0,
            failed_at: null,
            failure_reason: null
          })
          .eq("id", subscription.id);
      })
    )
  );

  let delivered = 0;
  let failed = 0;

  for (const result of deliveries) {
    if (result.status === "fulfilled") {
      delivered += 1;
      continue;
    }

    failed += 1;
    const error = result.reason as { endpoint?: string; statusCode?: number; body?: string } | undefined;
    const endpoint = error?.endpoint;
    if (!endpoint) {
      continue;
    }

    const deactivate = error?.statusCode === 404 || error?.statusCode === 410;
    const matching = (subscriptions ?? []).find((subscription) => subscription.endpoint === endpoint);

    if (!matching) {
      continue;
    }

    await supabase
      .from("web_push_subscriptions")
      .update({
        is_active: deactivate ? false : true,
        failure_count: (matching.failure_count ?? 0) + 1,
        failed_at: new Date().toISOString(),
        failure_reason: error?.body?.slice(0, 240) ?? "Push delivery failed."
      })
      .eq("id", matching.id);
  }

  return {
    delivered,
    failed,
    skipped: notifications.length
  };
}
