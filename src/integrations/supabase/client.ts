// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zglfcbnacrpujkpuumqe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbGZjYm5hY3JwdWprcHV1bXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2OTc2MTQsImV4cCI6MjA1MjI3MzYxNH0.bf4vEjZDbv6uYmkGr3WCKiBwLA3HKLonq51w4Dg6te0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);