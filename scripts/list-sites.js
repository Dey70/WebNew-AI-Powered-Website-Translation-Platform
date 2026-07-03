#!/usr/bin/env node
// Local-only, read-only listing of sites and their (non-secret) API key metadata.
// Usage: node scripts/list-sites.js

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, name, owner_email, allowed_origins, is_active, created_at")
    .order("created_at", { ascending: false });

  if (sitesError) {
    console.error("Failed to list sites:", sitesError.message);
    process.exit(1);
  }

  if (!sites || sites.length === 0) {
    console.log("No sites found.");
    return;
  }

  for (const site of sites) {
    const { data: keys } = await supabase
      .from("api_keys")
      .select("key_prefix, is_active, created_at, last_used_at, revoked_at")
      .eq("site_id", site.id)
      .order("created_at", { ascending: false });

    console.log(`\n${site.name} (${site.id})`);
    console.log(`  owner:     ${site.owner_email}`);
    console.log(`  origins:   ${(site.allowed_origins || []).join(", ")}`);
    console.log(`  active:    ${site.is_active}`);
    console.log(`  created:   ${site.created_at}`);
    console.log("  keys:");
    for (const key of keys || []) {
      console.log(
        `    ${key.key_prefix}...  active=${key.is_active}  last_used=${key.last_used_at || "never"}  revoked=${key.revoked_at || "no"}`
      );
    }
  }
}

main();
