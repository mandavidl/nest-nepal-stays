import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — NestNepal" },
      { name: "description", content: "Choose a new password for your NestNepal account." },
      { property: "og:title", content: "Set a new password — NestNepal" },
      { property: "og:description", content: "Finish resetting your NestNepal password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session));
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    void check();
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords need to match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => void navigate({ to: "/account" }), 1200);
  };

  return (
    <Shell>
      <section className="mx-auto max-w-md px-5 py-12">
        <Panel>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Set a new password</h1>
          {done ? (
            <p className="mt-2 text-[14px] text-stone2">
              Password updated. Taking you to your profile…
            </p>
          ) : !ready ? (
            <>
              <p className="mt-2 text-[14px] leading-relaxed text-stone2">
                Open this page from the reset link in your email to continue.
              </p>
              <Link to="/forgot-password" className={`${primaryButtonClass} mt-5`}>
                Request a new link
              </Link>
            </>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="field-label">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="field-label">Confirm new password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              {error && <p className="text-[13px] font-semibold text-brand-deep">{error}</p>}
              <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                {busy ? "Saving…" : "Save new password"}
              </button>
            </form>
          )}
        </Panel>
      </section>
    </Shell>
  );
}
