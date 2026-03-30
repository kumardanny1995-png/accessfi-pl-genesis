import { CreateGroupForm } from "@/components/group/create-group-form";
import { getGuestContext } from "@/lib/utils/guest";
import { createGroupAction } from "@/lib/actions/groups";

export default async function CreateGroupPage() {
  const { guestName } = await getGuestContext();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Create Group</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Start a recurring league or room</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Set the tone, the punishment line, and the sport focus. The standings will update automatically as settled boards come in.
        </p>
      </div>

      <CreateGroupForm action={createGroupAction} guestName={guestName} />
    </div>
  );
}
