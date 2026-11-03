import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wwpmyscfemmvnncnvyur.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cG15c2NmZW1tdm5uY252eXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTA1ODIsImV4cCI6MjEwOTI4NjU4Mn0._B1ZhIXlbaZigTHIYsl0TjmLPzfJ1-50kWBzz1WugBc';
export const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cG15c2NmZW1tdm5uY252eXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzcxMDU4MiwiZXhwIjoyMTA5Mjg2NTgyfQ.gA7LBk1daX-x5wTy0RUgZpBij5PKYvbv01xN2bUVKaY';

// We prioritize the key that allows unrestricted local single-user access
const activeKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const DEFAULT_USER = {
  id: 'omni_creator',
  email: 'creator@omnifocus.local',
  user_metadata: { name: 'OmniFocus Creator' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase Google OAuth notice:', error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('Sign out notice:', error);
};
