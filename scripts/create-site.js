#!/usr/bin/env node
// Local-only CLI for manually onboarding a site + issuing its first API key.
// Never exposed as an HTTP endpoint -- run from the developer's machine using
// the service-role key in .env.local. Usage:
//
//   node scripts/create-site.js --name "Acme Corp" --email owner@example.com \
//     --origin example.com --origin www.example.com

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

function parseArgs(argv) {
  const args = { origin: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--name") args.name = argv[++i];
    else if (arg === "--email") args.email = argv[++i];
    else if (arg === "--origin") args.origin.push(argv[++i]);
    else if (arg === "--base-url") args.baseUrl = argv[++i];
  }
  return args;
}

function generateApiKey() {
  const raw = "wn_live_" + crypto.randomBytes(24).toString("base64url");
  return { raw, prefix: raw.slice(0, 12) };
}

function hashApiKey(rawKey) {
  const pepper = process.env.API_KEY_PEPPER || "";
  return crypto.createHash("sha256").update(rawKey + pepper).digest("hex");
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.name || !args.email || args.origin.length === 0) {
    console.error(
      'Usage: node scripts/create-site.js --name "Acme Corp" --email owner@example.com --origin example.com [--origin www.example.com] [--base-url https://app.example.com]'
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  if (!process.env.API_KEY_PEPPER) {
    console.error("Missing API_KEY_PEPPER in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({ name: args.name, owner_email: args.email, allowed_origins: args.origin })
    .select()
    .single();

  if (siteError) {
    console.error("Failed to create site:", siteError.message);
    process.exit(1);
  }

  const { raw, prefix } = generateApiKey();
  const { error: keyError } = await supabase
    .from("api_keys")
    .insert({ site_id: site.id, key_prefix: prefix, key_hash: hashApiKey(raw) });

  if (keyError) {
    console.error("Failed to create API key:", keyError.message);
    process.exit(1);
  }

  const baseUrl = args.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://your-deployment-domain.com";

  console.log("\nSite created:");
  console.log(`  id:        ${site.id}`);
  console.log(`  name:      ${site.name}`);
  console.log(`  origins:   ${args.origin.join(", ")}`);
  console.log("\nAPI key (save this now -- it will not be shown again):");
  console.log(`  ${raw}\n`);
  console.log("Embed snippet:");
  console.log(`  <script
    src="${baseUrl}/cdn/webnew.js"
    data-base-url="${baseUrl}"
    data-api-key="${raw}"
    data-default-lang=""
    async
  ></script>\n`);
}

main();
