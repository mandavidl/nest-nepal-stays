import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapRowToProperty, orderedPhotoPaths, type PropertyRow } from "./property-mapper";
import type { Property } from "./nest-data";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;
const BUCKET = "property-photos";

const publicClient = () =>
  createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

const signAll = async (
  client: ReturnType<typeof publicClient>,
  rows: PropertyRow[],
): Promise<Record<string, string>> => {
  const paths = [...new Set(rows.flatMap((r) => orderedPhotoPaths(r)))].filter(
    (p) => p && !p.startsWith("http"),
  );
  if (!paths.length) return {};
  const { data } = await client.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  const map: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  return map;
};

/** Approved, published host listings — safe for anyone to read. */
export const getPublicProperties = createServerFn({ method: "GET" }).handler(
  async (): Promise<Property[]> => {
    const client = publicClient();
    const { data, error } = await client
      .from("properties")
      .select("*")
      .eq("property_status", "published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as PropertyRow[];
    const urls = await signAll(client, rows);
    return rows.map((row) => mapRowToProperty(row, urls));
  },
);

export const getPublicProperty = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }): Promise<Property | null> => {
    const client = publicClient();
    const { data: row, error } = await client
      .from("properties")
      .select("*")
      .eq("id", data.id)
      .eq("property_status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const typed = row as unknown as PropertyRow;
    const urls = await signAll(client, [typed]);
    return mapRowToProperty(typed, urls);
  });
