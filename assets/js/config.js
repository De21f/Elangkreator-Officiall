export const SUPABASE_URL="https://otadbnwnfetwbhqqhjwj.supabase.co";
export const SUPABASE_ANON_KEY="sb_publishable_8szB2oUM7DCtWWHRubegYw_A4Q47jeu";
export const AI_FUNCTION_URL=SUPABASE_URL+"/functions/v1/ai-chat";
export const isConfigured=!SUPABASE_URL.includes("YOUR-PROJECT")&&!SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
