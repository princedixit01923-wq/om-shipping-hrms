import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://nyhcyxpymyaifqyieslt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIsInJlZiI6Im55aHljeHB5bXlhaWZxeWllc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjYxNzQsImV4cCI6MjEwNTQwMjE3NH0._-t1QZbeVuzYRsYsq6jTsmgEFH5pALQ1Hf3IZFldqRY';

export function getActiveSupabaseConfig() {
  const customUrl = localStorage.getItem('OM_SUPABASE_URL');
  const customKey = localStorage.getItem('OM_SUPABASE_ANON_KEY');
  return {
    url: customUrl?.trim() || DEFAULT_SUPABASE_URL,
    anonKey: customKey?.trim() || DEFAULT_SUPABASE_ANON_KEY,
    isCustom: Boolean(customUrl || customKey)
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem('OM_SUPABASE_URL', url.trim());
  else localStorage.removeItem('OM_SUPABASE_URL');

  if (anonKey) localStorage.setItem('OM_SUPABASE_ANON_KEY', anonKey.trim());
  else localStorage.removeItem('OM_SUPABASE_ANON_KEY');

  // Re-create client instance
  const config = getActiveSupabaseConfig();
  supabase = createClient(config.url, config.anonKey);
}

const initialConfig = getActiveSupabaseConfig();
export let supabase: SupabaseClient = createClient(initialConfig.url, initialConfig.anonKey);

export async function checkSupabaseHealth(): Promise<{ connected: boolean; message: string }> {
  try {
    const res = await supabase.from('employees').select('count', { count: 'exact', head: true });
    if (res.error) {
      return { connected: false, message: res.error.message || 'Supabase connection error' };
    }
    return { connected: true, message: 'Supabase Cloud Connected & Synchronized' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Network unreachable' };
  }
}
