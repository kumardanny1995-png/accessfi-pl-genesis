import { JoinGroupForm } from "@/components/group/join-group-form";
import { getGuestContext } from "@/lib/utils/guest";
import { joinGroupAction } from "@/lib/actions/groups";

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function JoinGroupPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { guestName } = await getGuestContext();
  const resolvedSearchParams = await searchParams;
  const inviteCode = firstValue(resolvedSearchParams.invite);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Join Group</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Enter a room with one invite code</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Office league, creator room, college rivalry, or private crew. One code is enough to get onto the standings.
        </p>
      </div>

      <JoinGroupForm action={joinGroupAction} guestName={guestName} inviteCode={inviteCode} />
    </div>
  );
}
