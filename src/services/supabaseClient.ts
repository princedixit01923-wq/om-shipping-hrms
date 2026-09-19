import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyhcyxpymyaitqyieslt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIsInJlZiI6Im55aHljeHB5bXlhaWZxeWllc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjYxNzQsImV4cCI6MjEwNTQwMjE3NH0._-t1QZbeVuzYRsYsq6jTsmgEFH5pALQ1Hf3IZFldqRY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
