import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase credentials. Database features will not work.");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || supabaseAnonKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
