import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { useNest } from "@/lib/nest-store";

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
  const { signIn } = useNest();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    const name = email.split("@")[0] ?? "Guest";
    signIn(name.charAt(0).toUpperCase() + name.slice(1), email);
    navigate({ to: "/account" });
  };

  return (
    <Shell>
      <section className="mx-auto max-w-md px-5 py-12">
        <Panel>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[13px] text-stone2">
            Log in to see your bookings and saved stays.
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
            <button type="submit" className={`${primaryButtonClass} w-full`}>
              Log in
            </button>
          </form>
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
