export const SUPABASE_URL="https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
export const AI_FUNCTION_URL=SUPABASE_URL+"/functions/v1/ai-chat";
export const isConfigured=!SUPABASE_URL.includes("YOUR-PROJECT")&&!SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");