import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — NestNepal" },
      {
        name: "description",
        content: "Log in to NestNepal to manage your bookings, saved stays and host listings.",
      },
      { property: "og:title", content: "Log in — NestNepal" },
      { property: "og:description", content: "Access your NestNepal bookings and saved stays." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    void navigate({ to: "/account" });
  };

  const google = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in could not be completed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/account" });
  };

  return (
    <Shell>
      <section className="mx-auto max-w-md px-5 py-12">
        <Panel>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[13px] text-stone2">
            Log in to see your bookings, saved stays and host dashboard.
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
            <label className="block">
              <span className="field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} mt-1.5`}
              />
            </label>
            {error && <p className="text-[13px] font-semibold text-brand-deep">{error}</p>}
            <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
              {busy ? "Logging in…" : "Log in"}
            </button>
          </form>
          <button onClick={() => void google()} className={`${ghostButtonClass} mt-3 w-full`}>
            Continue with Google
          </button>
          <p className="mt-5 text-center text-[13px] text-stone2">
            New to NestNepal?{" "}
            <Link to="/signup" className="font-semibold text-brand-deep">
              Create an account
            </Link>
          </p>
        </Panel>
      </section>
    </Shell>
  );
}
