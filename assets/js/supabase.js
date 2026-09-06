import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {SUPABASE_URL,SUPABASE_ANON_KEY,isConfigured} from "./config.js";
export const supabase=isConfigured?createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
