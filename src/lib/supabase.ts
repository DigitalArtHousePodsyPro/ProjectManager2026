import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cmprmnfavqllgkfyoftu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHJtZm5hdnFsbGdrZnlvZnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NzYzMTYsImV4cCI6MjEwOTI1MjMxNn0.XRd2813eaYZzAZ3Y804JUrjrTztBsLyXaCDfNHUrj94';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
    console.error('Supabase Google OAuth login error:', error);
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

export const signInAnonymously = async () => {
  // If anonymous sign-in is enabled in Supabase
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Anonymous sign-in fallback:', err);
    throw err;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign out error:', error);
};
