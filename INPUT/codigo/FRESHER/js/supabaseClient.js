// 2nd script: creates the Supabase client.
// The CDN script (1st) exposes the global `supabase` object with createClient().

const SUPABASE_URL = "https://yggiouumfztjopomsgsg.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ2lvdXVtZnp0am9wb21zZ3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODg1NDYsImV4cCI6MjEwNzY2NDU0Nn0.YYanpWFgV_CsVQT-tZZVKfK2mWoOKDAjAXNe23cl538";

// Named `supabaseClient` (not `supabase`) to avoid shadowing the CDN global.
const { createClient } = supabase;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
