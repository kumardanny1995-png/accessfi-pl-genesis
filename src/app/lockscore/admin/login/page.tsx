import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { adminLoginAction } from "@/lib/actions/admin";

export default function LockScoreAdminLoginPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/42">Admin</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.04em] text-cream">Unlock LockScore ops</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Match creation, provider sync, manual settlement, and live mini-pick controls all sit behind the admin passcode.
        </p>
      </div>

      <AdminLoginForm action={adminLoginAction} />
    </div>
  );
}
