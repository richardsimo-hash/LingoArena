/**
 * Optional sign-in (Google, Apple, Microsoft) and cloud sync through Supabase.
 * Everything here is inert until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or the
 * NEXT_PUBLIC_SUPABASE_* names the Vercel integration creates) are set. The anon key is public by
 * design; row-level security in supabase/migrations limits each user to their own row.
 * The Supabase library is loaded only when sign-in is configured, so it never weighs on first load.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthProvider = "google" | "apple" | "azure";
export type Account = { id: string; email: string; name: string; provider: string };

const env = import.meta.env as Record<string, string | undefined>;
const URL = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
// Newer Supabase projects call the public key "publishable"; older ones "anon". Either works.
const KEY = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const authConfigured = Boolean(URL && KEY);

/** Providers to show, in order. Defaults to all three; set VITE_AUTH_PROVIDERS=google,azure to hide Apple. */
export const AUTH_PROVIDERS: AuthProvider[] = (env.VITE_AUTH_PROVIDERS || "google,apple,azure")
  .split(",").map((p) => p.trim()).filter((p): p is AuthProvider => p === "google" || p === "apple" || p === "azure");

let clientPromise: Promise<SupabaseClient> | null = null;
function client(): Promise<SupabaseClient> {
  if (!authConfigured) return Promise.reject(new Error("auth_not_configured"));
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) => createClient(URL, KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }));
  return clientPromise;
}

function toAccount(user: User | null | undefined): Account | null {
  if (!user) return null;
  const meta = (user.user_metadata || {}) as Record<string, string | undefined>;
  return {
    id: user.id,
    email: user.email || meta.email || "",
    name: meta.given_name || (meta.full_name || meta.name || "").split(" ")[0] || "",
    provider: String(user.app_metadata?.provider || ""),
  };
}

/** Redirects to the provider's login page and back to this page. */
export async function signIn(provider: AuthProvider) {
  const supabase = await client();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + window.location.pathname, scopes: provider === "azure" ? "email" : undefined },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = await client();
  await supabase.auth.signOut();
}

/** Calls back with the signed-in account now and on every change; returns an unsubscribe function. */
export function watchAccount(callback: (account: Account | null) => void): () => void {
  if (!authConfigured) return () => undefined;
  let unsubscribe = () => undefined as void;
  let active = true;
  void client().then(async (supabase) => {
    const { data } = await supabase.auth.getSession();
    if (active) callback(toAccount(data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { if (active) callback(toAccount(session?.user)); });
    unsubscribe = () => sub.subscription.unsubscribe();
  }).catch(() => callback(null));
  return () => { active = false; unsubscribe(); };
}

/** The saved app state for this user, or null if they have never synced. */
export async function loadCloudState(userId: string): Promise<{ state: unknown; updatedAt: string } | null> {
  const supabase = await client();
  const { data, error } = await supabase.from("progress").select("state, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? { state: data.state, updatedAt: data.updated_at as string } : null;
}

export async function saveCloudState(userId: string, state: unknown) {
  const supabase = await client();
  const { error } = await supabase.from("progress").upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
