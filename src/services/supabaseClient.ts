import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Dedicated Supabase Cloud credentials for OM Safety Services LLP
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://hqjklzostgmwqxgwhqqw.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxamtsem9zdGdtd3F4Z3docXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTcwODQsImV4cCI6MjEwODIzMzA4NH0.QPPEiycfpmLXdEBhEpvC2vgERtSJHddDnJ4L_bosiBQ';

// Single reliable production client instance
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Health check helper to test active connectivity with the remote database
 */
export async function checkSupabaseHealth(): Promise<{ connected: boolean; message: string }> {
  try {
    const res = await supabase.from('employees').select('count', { count: 'exact', head: true });
    if (res.error) {
      return { connected: false, message: res.error.message || 'Database connection error' };
    }
    return { connected: true, message: 'Supabase Cloud Connected & Synchronized' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Network unreachable' };
  }
}
