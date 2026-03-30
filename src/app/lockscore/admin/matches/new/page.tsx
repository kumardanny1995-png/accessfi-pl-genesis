import { CreateMatchForm } from "@/components/admin/create-match-form";
import { createMatchAction } from "@/lib/actions/admin";
import { requireAdminSession } from "@/lib/utils/admin";

export default async function LockScoreCreateMatchPage() {
  await requireAdminSession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Admin Match Create</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Create a new fixture</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
          Use classic social templates for expressive boards or provider-ready cricket boards when you want automatic settlement from the score feed.
        </p>
      </div>

      <CreateMatchForm action={createMatchAction} />
    </div>
  );
}
