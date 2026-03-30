import type { Route } from "next";
import Link from "next/link";

import { Panel } from "@/components/shared/panel";
import type { NotificationView } from "@/lib/db/types";

export function NotificationList({ items }: { items: NotificationView[] }) {
  if (items.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-white/68">No notifications yet. They start appearing when rivals join or results settle.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const content = (
          <Panel className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{item.type}</p>
            <h3 className="text-lg font-black uppercase tracking-[0.04em] text-cream">{item.title}</h3>
            <p className="text-sm leading-6 text-white/68">{item.body}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </Panel>
        );

        return item.href ? (
          <Link key={item.id} href={item.href as Route} className="block">
            {content}
          </Link>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}
