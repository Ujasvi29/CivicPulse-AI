import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Convert a File object to base64 data string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetch list of departments
 */
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, description')
      .order('name');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.warn('Using fallback departments list:', error.message);
    return {
      success: true,
      data: [
        { id: 'dept-1', name: 'Roads & Infrastructure', description: 'Potholes, damaged footpaths, road maintenance' },
        { id: 'dept-2', name: 'Waste Management', description: 'Garbage accumulation, illegal dumping, bin collection' },
        { id: 'dept-3', name: 'Water & Drainage', description: 'Pipe leaks, water supply, clogged drains' },
        { id: 'dept-4', name: 'Electricity & Public Lighting', description: 'Broken streetlights, transformer issues' },
        { id: 'dept-5', name: 'Public Safety', description: 'Public hazards, open manholes, safety concerns' },
        { id: 'dept-6', name: 'Sanitation', description: 'Hygiene, public facilities cleanliness' },
        { id: 'dept-7', name: 'General Civic Services', description: 'General municipal complaints' },
      ],
    };
  }
};

/**
 * Phase 7: Submit and execute multimodal Gemini AI analysis
 * Sends report details + photographic evidence to backend
 */
export const submitAndAnalyzeCivicReport = async ({
  title,
  description,
  category,
  latitude = null,
  longitude = null,
  address = '',
  imageFile = null,
  userId = null,
}) => {
  try {
    let imageBase64 = null;
    let imageMimeType = 'image/jpeg';

    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
      imageMimeType = imageFile.type || 'image/jpeg';
    }

    // Get active Supabase session token if available
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const activeUserId = userId || sessionData?.session?.user?.id;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'Let AI determine category',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address.trim() || 'Location specified by citizen',
      image_base64: imageBase64,
      image_mime_type: imageMimeType,
      user_id: activeUserId,
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server returned error ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      caseNumber: data.case_number,
      report: data.report,
      aiAnalysis: data.ai_analysis,
      metrics: data.metrics,
    };
  } catch (error) {
    console.error('Error submitting civic report:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit report. Please check backend connection.',
    };
  }
};

/**
 * Get all reports submitted by a specific user
 */
export const getUserReports = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get detailed report by ID including timeline updates and AI diagnostics
 */
export const getReportById = async (reportId) => {
  try {
    // 1. Fetch report details
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select('*, departments(id, name, description)')
      .eq('id', reportId)
      .single();

    if (reportErr) throw reportErr;

    // 2. Fetch timeline updates
    const { data: updates, error: updatesErr } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    // 3. Fetch AI analysis if available
    const { data: aiAnalysis } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('report_id', reportId)
      .maybeSingle();

    return {
      success: true,
      data: {
        ...report,
        updates: updates || [],
        ai_analysis: aiAnalysis || null,
      },
    };
  } catch (error) {
    console.error('Error fetching report details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get public civic reports for community view
 */
export const getPublicReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, case_number, title, description, category, subcategory, status, priority, impact_score, address, latitude, longitude, created_at, image_url')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching community reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, { fullName, city }) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        city: city.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};
