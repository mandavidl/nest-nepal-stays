import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { useNest } from "@/lib/nest-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — NestNepal" },
      {
        name: "description",
        content:
          "Create a free NestNepal account to book verified stays across Nepal or list your own property.",
      },
      { property: "og:title", content: "Sign up — NestNepal" },
      {
        property: "og:description",
        content: "Join NestNepal to book verified Nepali stays or host your own place.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signIn } = useNest();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"guest" | "host">("guest");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || !email.includes("@") || password.length < 6) {
      setError("Add your name, a valid email and a password of at least 6 characters.");
      return;
    }
    signIn(name.trim(), email);
    navigate({ to: intent === "host" ? "/host" : "/account" });
  };

  return (
    <Shell>
      <section className="mx-auto max-w-md px-5 py-12">
        <Panel>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-[13px] text-stone2">Free to join. Book or host in minutes.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sita Adhikari"
                className={`${inputClass} mt-1.5`}
              />
            </label>
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
                placeholder="At least 6 characters"
                className={`${inputClass} mt-1.5`}
              />
            </label>
            <div>
              <span className="field-label">I want to</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    ["guest", "Book stays"],
                    ["host", "List a property"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntent(value)}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      intent === value
                        ? "border-brand bg-cream text-brand-deep"
                        : "border-sand bg-surface hover:border-brand/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-[13px] font-semibold text-brand-deep">{error}</p>}
            <button type="submit" className={`${primaryButtonClass} w-full`}>
              Create account
            </button>
          </form>
          <p className="mt-5 text-center text-[13px] text-stone2">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-deep">
              Log in
            </Link>
          </p>
        </Panel>
      </section>
    </Shell>
  );
}
