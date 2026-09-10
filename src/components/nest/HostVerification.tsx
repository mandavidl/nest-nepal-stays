import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, inputClass, primaryButtonClass } from "./Bits";
import { useNest } from "@/lib/nest-store";
import { isValidNepalPhone, normalizeNepalPhone } from "@/lib/nest-validation";

export const OWNER_PHONE = "9761715925";
export const OWNER_EMAIL = "mandavidhakal978@gmail.com";

const statusCopy: Record<string, { title: string; body: string }> = {
  pending: {
    title: "Your host verification request is being reviewed",
    body: "We will contact you on the number you provided once a decision is made. You can keep booking stays as a guest in the meantime.",
  },
  rejected: {
    title: "Your host verification request was not approved",
    body: "Get in touch using the contact details below if you would like this reviewed again.",
  },
  suspended: {
    title: "Your hosting access is currently suspended",
    body: "Contact NestNepal using the details below to resolve this.",
  },
};

export function HostVerification() {
  const { account, permissions, hostApplication, requestHostVerification } = useNest();
  const [phone, setPhone] = useState(account.phone);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const status = permissions.hostStatus;

  if (!account.signedIn) {
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold">Log in to request host verification</h2>
        <p className="mt-2 text-[14px] text-stone2">
          You need one NestNepal account. Every account starts as a guest and can request host
          verification once.
        </p>
        <Link to="/login" className={`${primaryButtonClass} mt-4`}>
          Log in
        </Link>
      </Panel>
    );
  }

  if (submitted) {
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold">
          Verification request submitted. Your request is pending review.
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-stone2">
          Your request is now waiting for review. We will contact you on {phone || account.phone}{" "}
          once a decision is made. You can keep browsing and booking stays as a guest.
        </p>
        <ContactDetails />
      </Panel>
    );
  }

  if (status !== "not_host") {
    const copy = statusCopy[status];
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold">
          {copy?.title ?? "Host verification status"}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-stone2">{copy?.body}</p>
        {hostApplication?.decisionNote && (
          <p className="mt-3 rounded-2xl bg-cream p-3 text-[13px] text-stone2">
            Note from NestNepal: {hostApplication.decisionNote}
          </p>
        )}
        <ContactDetails />
      </Panel>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidNepalPhone(phone)) {
      setError("Add a valid Nepal mobile number, for example 9812345678.");
      return;
    }
    setBusy(true);
    try {
      await requestHostVerification(message.trim(), normalizeNepalPhone(phone));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <h2 className="font-display text-xl font-semibold">
        You&apos;re not currently listed as a verified host.
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-stone2">
        To list properties and start earning on NestNepal, you need to be manually verified. This
        happens once for your account — after that you can add as many properties as you like.
      </p>
      <ContactDetails />
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">Your contact number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9812345678"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className="block">
          <span className="field-label">Tell us about the place you want to list (optional)</span>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A two-bedroom homestay in Bandipur, ready from next month."
            className={`${inputClass} mt-1.5`}
          />
        </label>
        {error && <p className="text-[13px] font-semibold text-brand-deep">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full sm:w-auto`}>
          {busy ? "Sending request…" : "Request Host Verification"}
        </button>
      </form>
    </Panel>
  );
}

function ContactDetails() {
  return (
    <div className="mt-4 rounded-2xl bg-cream p-4 text-[14px]">
      <p className="font-semibold">Contact NestNepal</p>
      <p className="mt-1 text-stone2">
        Phone:{" "}
        <a href={`tel:${OWNER_PHONE}`} className="font-semibold text-brand-deep">
          {OWNER_PHONE}
        </a>
      </p>
      <p className="text-stone2">
        Email:{" "}
        <a href={`mailto:${OWNER_EMAIL}`} className="font-semibold text-brand-deep">
          {OWNER_EMAIL}
        </a>
      </p>
    </div>
  );
}
