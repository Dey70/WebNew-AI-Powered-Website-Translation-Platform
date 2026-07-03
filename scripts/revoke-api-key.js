#!/usr/bin/env node
// Local-only key revocation -- e.g. for handling a compromised key or an
// offboarded customer, without any new infrastructure.
// Usage: node scripts/revoke-api-key.js --prefix wn_live_a1B2

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--prefix") args.prefix = argv[++i];
  }
  return args;
}

async function main() {
  const { prefix } = parseArgs(process.argv);
  if (!prefix) {
    console.error("Usage: node scripts/revoke-api-key.js --prefix wn_live_a1B2");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("key_prefix", prefix)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Failed to revoke key:", error.message);
    process.exit(1);
  }
  if (!data) {
    console.error(`No API key found with prefix ${prefix}`);
    process.exit(1);
  }

  console.log(`Revoked key ${prefix}... (site_id: ${data.site_id})`);
}

main();
