"use client";

import { useMemo, useState } from "react";

import { Copy, ExternalLink, Send, Share2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { buildTelegramLink, buildWhatsAppLink } from "@/lib/utils/share";

type ShareActionsProps = {
  challengeId: string;
  challengeSlug: string;
  text: string;
  url: string;
  stage: "pre_match" | "results";
};

async function trackShare(payload: {
  challengeId: string;
  stage: "pre_match" | "results";
  surface: "native" | "whatsapp" | "telegram" | "copy" | "card";
  targetUrl: string;
  messageTemplate: string;
}) {
  await fetch("/api/share", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).catch(() => null);
}

export function ShareActions({ challengeId, challengeSlug, text, url, stage }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const whatsappUrl = useMemo(() => buildWhatsAppLink(text, url), [text, url]);
  const telegramUrl = useMemo(() => buildTelegramLink(text, url), [text, url]);
  const cardUrl = useMemo(
    () => (stage === "results" ? `/api/og/results/${challengeSlug}` : `/api/og/challenge/${challengeSlug}`),
    [challengeSlug, stage]
  );

  async function handleNativeShare() {
    if (!navigator.share) {
      return;
    }

    await navigator.share({ title: "LockScore", text, url });
    await trackShare({ challengeId, stage, surface: "native", targetUrl: url, messageTemplate: text });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    await trackShare({ challengeId, stage, surface: "copy", targetUrl: url, messageTemplate: text });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleExternal(surface: "whatsapp" | "telegram" | "card", targetUrl: string) {
    await trackShare({ challengeId, stage, surface, targetUrl, messageTemplate: text });
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {canNativeShare ? (
        <Button variant="primary" fullWidth onClick={handleNativeShare} className="gap-2">
          <Share2 size={16} />
          Native Share
        </Button>
      ) : null}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => handleExternal("whatsapp", whatsappUrl)}
        className="gap-2"
      >
        <Send size={16} />
        WhatsApp
      </Button>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => handleExternal("telegram", telegramUrl)}
        className="gap-2"
      >
        <Send size={16} />
        Telegram
      </Button>
      <Button variant="ghost" fullWidth onClick={handleCopy} className="gap-2">
        <Copy size={16} />
        {copied ? "Copied" : "Copy Link"}
      </Button>
      <Button variant="ghost" fullWidth onClick={() => handleExternal("card", cardUrl)} className="gap-2">
        <ExternalLink size={16} />
        Open Share Card
      </Button>
    </div>
  );
}
