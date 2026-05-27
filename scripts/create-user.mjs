// Script para crear un usuario admin en Supabase Auth.
// Uso: node scripts/create-user.mjs <email> <password>
// Lee credenciales de .env.local

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv(path) {
  const raw = readFileSync(path, "utf-8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const env = loadEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === "placeholder") {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Uso: node scripts/create-user.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // sin verificación de correo
});

if (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}

console.log("✅ Usuario creado:");
console.log("   email:   ", data.user?.email);
console.log("   id:      ", data.user?.id);
console.log("   created: ", data.user?.created_at);
console.log("");
console.log("Puede iniciar sesión en https://arratia-t.vercel.app/login");
