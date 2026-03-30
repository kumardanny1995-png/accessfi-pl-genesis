"use client";

import { Bell, BellOff, BellRing, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/shared/button";
import { Panel } from "@/components/shared/panel";

type PushState = "checking" | "unconfigured" | "unsupported" | "blocked" | "ready" | "enabled" | "loading";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function PushOptInCard({ guestReady, guestName }: { guestReady: boolean; guestName: string | null }) {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "";
  const [state, setState] = useState<PushState>("checking");
  const [message, setMessage] = useState<string>("");
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function inspect() {
      if (!guestReady) {
        setState(publicKey ? "ready" : "unconfigured");
        return;
      }

      if (!publicKey) {
        setState("unconfigured");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState("unsupported");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (cancelled) {
        return;
      }

      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }

      setEndpoint(subscription?.endpoint ?? null);
      setState(subscription ? "enabled" : "ready");
    }

    inspect().catch(() => {
      if (!cancelled) {
        setState("unsupported");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [guestReady, publicKey]);

  async function subscribe() {
    if (!guestReady) {
      setMessage("Create or join a challenge first so LockScore knows who to alert.");
      return;
    }

    if (!publicKey) {
      setState("unconfigured");
      return;
    }

    try {
      setState("loading");
      setMessage("");

      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        setState("blocked");
        setMessage("Browser alerts are blocked for this device.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      const payload = (await response.json().catch(() => ({ ok: false, message: "Could not enable push alerts." }))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Could not enable push alerts.");
      }

      setEndpoint(subscription.endpoint);
      setState("enabled");
      setMessage("Browser alerts are enabled for rivalry updates and live mini-picks.");
    } catch (error) {
      setState("ready");
      setMessage(error instanceof Error ? error.message : "Could not enable browser alerts.");
    }
  }

  async function unsubscribe() {
    try {
      setState("loading");
      setMessage("");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription?.endpoint) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        await subscription.unsubscribe();
      }

      setEndpoint(null);
      setState("ready");
      setMessage("Browser alerts are turned off on this device.");
    } catch (error) {
      setState("enabled");
      setMessage(error instanceof Error ? error.message : "Could not disable browser alerts.");
    }
  }

  const icon =
    state === "enabled" ? (
      <BellRing className="text-signal-green" size={18} />
    ) : state === "blocked" ? (
      <BellOff className="text-signal-red" size={18} />
    ) : (
      <Bell className="text-white/82" size={18} />
    );

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Browser Push</p>
          <h2 className="text-2xl font-black uppercase tracking-[0.04em] text-cream">Keep rivalry alerts on your phone</h2>
          <p className="text-sm leading-7 text-white/68">
            Get nudged when rivals join, live mini-picks open, results land, or someone cooks your board.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">{icon}</div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/72">
        {!guestReady
          ? "Create or join a board first, then this device can subscribe to your alerts."
          : state === "unconfigured"
            ? "Web push keys are not configured yet in the environment."
            : state === "unsupported"
              ? "This browser does not support push notifications."
              : state === "blocked"
                ? "Notification permission is blocked in this browser."
                : state === "enabled"
                  ? `${guestName ?? "This device"} is subscribed for browser alerts.`
                  : "Browser alerts are available on this device."}
      </div>

      {endpoint ? (
        <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
          Endpoint active on this browser
        </div>
      ) : null}

      {message ? <p className="text-sm text-white/78">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        {state === "enabled" ? (
          <Button variant="ghost" onClick={() => void unsubscribe()}>
            Turn Off Push
          </Button>
        ) : (
          <Button onClick={() => void subscribe()} disabled={!guestReady || state === "loading" || state === "unsupported" || state === "unconfigured"}>
            Enable Push Alerts
          </Button>
        )}
        <div className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
          <Smartphone size={16} />
          {state === "enabled" ? "live on this device" : "device-based opt-in"}
        </div>
      </div>
    </Panel>
  );
}
