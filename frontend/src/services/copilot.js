// src/services/copilot.js
import { supabase } from './supabase';

/**
 * Resiliently retrieve current Supabase access token.
 */
export const getSupabaseAccessToken = async () => {
  // 1. Try active getSession()
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      return sessionData.session.access_token;
    }
  } catch (e) {
    console.warn('supabase.auth.getSession warning:', e);
  }

  // 2. Try refreshSession()
  try {
    const { data: refreshData } = await supabase.auth.refreshSession();
    if (refreshData?.session?.access_token) {
      return refreshData.session.access_token;
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback: inspect localStorage for cached Supabase session token
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
};

/**
 * Send a message to the CivicPulse Copilot backend endpoint.
 * Returns the JSON response from the API.
 */
export const sendCopilotMessage = async ({
  message,
  latitude = null,
  longitude = null,
  address = '',
  category_hint = null,
  token = null,
}) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Obtain active authenticated session token
  const activeToken = token || (await getSupabaseAccessToken());

  if (!activeToken) {
    throw new Error('Please sign in to your account to use CivicPulse Copilot.');
  }

  const payload = {
    message,
    latitude,
    longitude,
    address,
    category_hint,
  };

  const response = await fetch(`${API_BASE_URL}/api/copilot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error(err.detail || 'Your session has expired. Please sign in again.');
    }
    throw new Error(err.detail || `Copilot request failed with status ${response.status}`);
  }

  return await response.json();
};
