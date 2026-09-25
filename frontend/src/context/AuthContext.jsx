import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { apiClient } from '../services/api';

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
      const userRole = metadata.role === 'admin' ? 'admin' : 'citizen';
      const newProfile = {
        id: userId,
        full_name: metadata.full_name || userEmail.split('@')[0],
        email: userEmail,
        role: userRole,
        city: metadata.city || (userRole === 'admin' ? 'Municipal Administration' : 'City Region'),
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
      const userRole = metadata.role === 'admin' ? 'admin' : 'citizen';
      setProfile({
        id: userId,
        email: userEmail,
        role: userRole,
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

  const VALID_ADMIN_INVITES = new Set(['cityadmin', 'civic_admin_2026', 'admin2026', 'civic2026', 'admin']);

  const registerAdmin = async ({ fullName, email, password, department, inviteCode }) => {
    // 1. Verify invitation code
    const normalizedCode = (inviteCode || '').trim().toLowerCase();
    if (!VALID_ADMIN_INVITES.has(normalizedCode)) {
      return {
        success: false,
        error: 'Invalid Administrator Invitation Code. Authorization denied.',
      };
    }

    // 2. Perform Supabase Auth SignUp with admin role metadata
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            city: department || 'Municipal Administration',
            role: 'admin',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Upsert admin profile record
        const adminProfile = {
          id: data.user.id,
          full_name: fullName,
          email,
          role: 'admin',
          city: department || 'Municipal Administration',
        };

        await supabase.from('profiles').upsert(adminProfile);
        setProfile(adminProfile);

        // If session created, sign in immediately
        if (data.session) {
          setUser(data.user);
          setSession(data.session);
          return { success: true, user: data.user, role: 'admin' };
        } else {
          // Attempt sign in if email confirmation not strictly required
          const loginRes = await signIn({ email, password });
          if (loginRes.success) {
            return loginRes;
          }
          return {
            success: true,
            user: data.user,
            role: 'admin',
            message: 'Administrator account registered. Please sign in.',
          };
        }
      }

      return { success: false, error: 'Failed to create administrator account.' };
    } catch (error) {
      console.error('registerAdmin error:', error);
      return { success: false, error: humanizeAuthError(error) };
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
    registerAdmin,
    signIn,
    signOut,
    resetPassword,
    refreshProfile: () => user && fetchProfile(user.id, user.email, user.user_metadata),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
