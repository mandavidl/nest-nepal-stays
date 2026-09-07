/** Nepal mobile numbers: 10 digits starting 96/97/98, optionally with +977. */
export const normalizeNepalPhone = (value: string) => {
  const trimmed = value.replace(/[\s-]/g, "");
  return trimmed.startsWith("+977") ? trimmed.slice(4) : trimmed.replace(/^977/, "");
};

export const isValidNepalPhone = (value: string) =>
  /^9[678][0-9]{8}$/.test(normalizeNepalPhone(value ?? ""));

export const formatNepalPhone = (value: string) => {
  const n = normalizeNepalPhone(value ?? "");
  return n ? `+977 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : "";
};
