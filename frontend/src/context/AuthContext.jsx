import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile row in public.profiles
  const fetchProfile = async (userId, userEmail, metadata = {}) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', error.message);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // Fallback: Create default profile if missing
      const newProfile = {
        id: userId,
        full_name: metadata.full_name || userEmail.split('@')[0],
        email: userEmail,
        role: 'citizen',
        city: metadata.city || 'City Region',
      };

      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (!insertErr && created) {
        setProfile(created);
        return created;
      } else {
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.error('Profile synchronization error:', err);
      setProfile({
        id: userId,
        email: userEmail,
        role: 'citizen',
        full_name: metadata.full_name || 'Citizen',
      });
    }
  };

  useEffect(() => {
    // Initial Session Check
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata);
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' && currentSession?.user) {
        await fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper for humanized error strings
  const humanizeAuthError = (error) => {
    if (!error) return 'An unexpected authentication error occurred.';
    const msg = error.message || error.toString();

    if (msg.includes('Invalid login credentials')) {
      return "That email or password doesn't match our records. Please try again.";
    }
    if (msg.includes('User already registered') || msg.includes('already exists')) {
      return 'This email is already registered. Try signing in instead.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Your password needs at least 6 characters.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please confirm your email address before logging in.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Unable to reach authentication server. Please check your internet connection.';
    }
    return msg;
  };

  // Auth Operations
  const signUp = async ({ fullName, email, password, city }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            city: city || 'City Region',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id, email, { full_name: fullName, city });
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: humanizeAuthError(error) };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
        return { success: true, user: data.user, role: userProfile?.role || 'citizen' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: humanizeAuthError(error) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: humanizeAuthError(error) };
    }
  };

  const value = {
    user,
    session,
    profile,
    role: profile?.role || 'citizen',
    isAdmin: profile?.role === 'admin',
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile: () => user && fetchProfile(user.id, user.email, user.user_metadata),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
