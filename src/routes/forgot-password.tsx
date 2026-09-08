import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — NestNepal" },
      {
        name: "description",
        content: "Request a password reset link for your NestNepal account.",
      },
      { property: "og:title", content: "Reset your password — NestNepal" },
      { property: "og:description", content: "We'll email you a link to set a new password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter the email address on your account.");
      return;
    }
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <Shell>
      <section className="mx-auto max-w-md px-5 py-12">
        <Panel>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Forgot password</h1>
          {sent ? (
            <>
              <p className="mt-2 text-[14px] leading-relaxed text-stone2">
                Check your inbox — we sent a link to {email}. Open it to set a new password.
              </p>
              <Link to="/login" className={`${primaryButtonClass} mt-5`}>
                Back to log in
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-[13px] text-stone2">
                We&apos;ll email you a secure link to set a new password.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="field-label">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
                {error && <p className="text-[13px] font-semibold text-brand-deep">{error}</p>}
                <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <p className="mt-5 text-center text-[13px] text-stone2">
                <Link to="/login" className="font-semibold text-brand-deep">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </Panel>
      </section>
    </Shell>
  );
}
