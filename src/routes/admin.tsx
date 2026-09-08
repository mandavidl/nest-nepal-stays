import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/nest/Shell";
import { Panel, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/nest/Bits";
import { supabase } from "@/integrations/supabase/client";
import { useNest } from "@/lib/nest-store";
import { formatNpr } from "@/lib/nest-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — NestNepal" },
      { name: "description", content: "NestNepal moderation dashboard for owners and admins." },
      { property: "og:title", content: "Admin — NestNepal" },
      { property: "og:description", content: "Host and listing moderation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const sections = [
  "Host applications",
  "Properties",
  "Manage administrators",
  "Audit log",
] as const;
type Section = (typeof sections)[number];

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type PropertyRowLite = {
  id: string;
  property_name: string;
  city: string;
  host_id: string;
  price_per_night: number;
  property_status: string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  full_name: string;
  email: string | null;
  host_status: string;
};

type RoleRow = { user_id: string; role: string };

type AuditRow = {
  id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
  actor_id: string;
  target_user_id: string | null;
  target_property_id: string | null;
};

function AdminDashboard() {
  const { permissions, ready, account } = useNest();
  const [section, setSection] = useState<Section>("Host applications");

  if (!ready) {
    return (
      <Shell>
        <section className="mx-auto max-w-6xl px-5 py-12">
          <Panel>
            <p className="text-[14px] text-stone2">Checking your access…</p>
          </Panel>
        </section>
      </Shell>
    );
  }

  if (!permissions.isStaff) {
    return (
      <Shell>
        <section className="mx-auto max-w-md px-5 py-12">
          <Panel>
            <h1 className="font-display text-2xl font-semibold">Not available</h1>
            <p className="mt-2 text-[14px] text-stone2">
              This area is only for NestNepal administrators.
            </p>
            <Link to={account.signedIn ? "/account" : "/login"} className={`${primaryButtonClass} mt-5`}>
              {account.signedIn ? "Back to my profile" : "Log in"}
            </Link>
          </Panel>
        </section>
      </Shell>
    );
  }

  const visible = sections.filter((s) => s !== "Manage administrators" || permissions.isOwner);

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-deep">
          {permissions.isOwner ? "Owner" : "Admin"}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
          Moderation dashboard
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:h-fit lg:flex-col lg:px-0">
            {visible.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                aria-current={section === s}
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  section === s
                    ? "bg-ink text-cream"
                    : "border border-sand bg-surface text-stone2 hover:border-brand/40 hover:text-ink lg:border-0 lg:bg-transparent"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          <div className="space-y-5">
            {section === "Host applications" && <HostApplications />}
            {section === "Properties" && <PropertyQueue />}
            {section === "Manage administrators" && permissions.isOwner && <ManageAdmins />}
            {section === "Audit log" && <AuditLog />}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function useNotice() {
  const [notice, setNotice] = useState("");
  return [notice, setNotice] as const;
}

function HostApplications() {
  const [rows, setRows] = useState<Application[]>([]);
  const [notice, setNotice] = useNotice();
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("host_applications")
      .select("id, user_id, full_name, email, phone_number, message, status, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Application[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const { error } = await supabase.rpc("review_host_application", {
      _application_id: id,
      _decision: decision,
      ...(note ? { _note: note } : {}),
    });
    setNotice(error ? error.message : `Application ${decision}.`);
    setNote("");
    await load();
  };

  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      {notice && (
        <Panel>
          <p className="text-[13px] font-semibold text-brand-deep">{notice}</p>
        </Panel>
      )}
      <Panel>
        <h2 className="font-display text-lg font-semibold">Waiting for review ({pending.length})</h2>
        <label className="mt-3 block">
          <span className="field-label">Note to the applicant (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <div className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-[14px] text-stone2">Nothing to review.</p>}
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl bg-cream p-4">
              <p className="font-semibold">{r.full_name || "Unnamed guest"}</p>
              <p className="mt-0.5 text-[13px] text-stone2">
                {r.email} · {r.phone_number}
              </p>
              {r.message && <p className="mt-2 text-[14px] text-stone2">{r.message}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => void decide(r.id, "approved")}
                  className={primaryButtonClass}
                >
                  Approve host
                </button>
                <button onClick={() => void decide(r.id, "rejected")} className={ghostButtonClass}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      {decided.length > 0 && (
        <Panel>
          <h2 className="font-display text-lg font-semibold">Decided</h2>
          <ul className="mt-3 space-y-2 text-[14px] text-stone2">
            {decided.map((r) => (
              <li key={r.id}>
                {r.full_name} — {r.status}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function PropertyQueue() {
  const [rows, setRows] = useState<PropertyRowLite[]>([]);
  const [notice, setNotice] = useNotice();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("properties")
      .select("id, property_name, city, host_id, price_per_night, property_status, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as PropertyRowLite[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: string) => {
    const { error } = await supabase.rpc("review_property", {
      _property_id: id,
      _status: status,
    });
    setNotice(error ? error.message : `Listing set to ${status.replace("_", " ")}.`);
    await load();
  };

  return (
    <div className="space-y-4">
      {notice && (
        <Panel>
          <p className="text-[13px] font-semibold text-brand-deep">{notice}</p>
        </Panel>
      )}
      {rows.length === 0 && (
        <Panel>
          <p className="text-[14px] text-stone2">No listings submitted yet.</p>
        </Panel>
      )}
      {rows.map((r) => (
        <Panel key={r.id}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight">{r.property_name}</p>
              <p className="mt-0.5 text-[13px] text-stone2">
                {r.city} · {formatNpr(r.price_per_night)} / night
              </p>
              <p className="mt-1 text-[13px] font-semibold text-brand-deep">
                {r.property_status.replace("_", " ")}
              </p>
              <Link
                to="/property/$propertyId"
                params={{ propertyId: r.id }}
                className="mt-1 inline-block text-[13px] font-semibold text-brand-deep"
              >
                Open listing
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void review(r.id, "published")} className={primaryButtonClass}>
                Publish
              </button>
              <button onClick={() => void review(r.id, "rejected")} className={ghostButtonClass}>
                Reject
              </button>
              <button onClick={() => void review(r.id, "suspended")} className={ghostButtonClass}>
                Suspend
              </button>
              <button onClick={() => void review(r.id, "removed")} className={ghostButtonClass}>
                Remove
              </button>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function ManageAdmins() {
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useNotice();

  const load = useCallback(async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, host_status").limit(200),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p ?? []) as ProfileLite[]);
    setRoles((r ?? []) as RoleRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleOf = (id: string) => roles.find((r) => r.user_id === id)?.role;

  const change = async (id: string, action: "assign" | "remove") => {
    const { error } = await supabase.rpc(action === "assign" ? "assign_admin" : "remove_admin", {
      _user_id: id,
    });
    setNotice(error ? error.message : action === "assign" ? "Admin access granted." : "Admin access removed.");
    await load();
  };

  const filtered = profiles.filter((p) =>
    `${p.full_name} ${p.email ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {notice && (
        <Panel>
          <p className="text-[13px] font-semibold text-brand-deep">{notice}</p>
        </Panel>
      )}
      <Panel>
        <h2 className="font-display text-lg font-semibold">Manage administrators</h2>
        <p className="mt-1 text-[13px] text-stone2">
          Only the owner can grant or remove admin access. Every change is written to the audit log.
        </p>
        <label className="mt-4 block">
          <span className="field-label">Search users</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <div className="mt-4 space-y-3">
          {filtered.slice(0, 25).map((p) => {
            const role = roleOf(p.id);
            return (
              <div
                key={p.id}
                className="grid gap-2 rounded-2xl bg-cream p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.full_name || "Unnamed user"}</p>
                  <p className="truncate text-[13px] text-stone2">{p.email}</p>
                  <p className="text-[12px] text-stone2">
                    {role ? role.toUpperCase() : "GUEST"} · host: {p.host_status}
                  </p>
                </div>
                {role === "owner" ? (
                  <span className="text-[13px] font-semibold text-brand-deep">Owner</span>
                ) : role === "admin" ? (
                  <button onClick={() => void change(p.id, "remove")} className={ghostButtonClass}>
                    Remove admin
                  </button>
                ) : (
                  <button onClick={() => void change(p.id, "assign")} className={primaryButtonClass}>
                    Make admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    void supabase
      .from("moderation_actions")
      .select(
        "id, action, previous_value, new_value, notes, created_at, actor_id, target_user_id, target_property_id",
      )
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data ?? []) as AuditRow[]));
  }, []);

  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">Audit log</h2>
      <p className="mt-1 text-[13px] text-stone2">
        Read-only record of every host and listing decision.
      </p>
      <div className="mt-4 space-y-2">
        {rows.length === 0 && <p className="text-[14px] text-stone2">No actions recorded yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl bg-cream p-3 text-[13px]">
            <p className="font-semibold">{r.action.replace(/_/g, " ")}</p>
            <p className="mt-0.5 text-stone2">
              {new Date(r.created_at).toLocaleString()} · {r.previous_value ?? "—"} →{" "}
              {r.new_value ?? "—"}
            </p>
            {r.notes && <p className="mt-0.5 text-stone2">{r.notes}</p>}
          </div>
        ))}
      </div>
    </Panel>
  );
}
