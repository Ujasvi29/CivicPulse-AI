import { supabase } from './supabase';

/**
 * Generate a unique case tracking code in format CIV-2026-XXXX
 */
export const generateCaseNumber = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `CIV-${year}-${randomSuffix}`;
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
    console.warn('Could not fetch departments from DB, using fallback list:', error.message);
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
 * Create a new civic report in Supabase
 */
export const createReport = async ({
  title,
  description,
  category,
  subcategory = null,
  latitude = null,
  longitude = null,
  address = '',
  imageFile = null,
  userId,
}) => {
  try {
    const caseNumber = generateCaseNumber();
    let imageUrl = null;

    // Handle Image upload if provided
    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('civic-images')
          .upload(filePath, imageFile);

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('civic-images').getPublicUrl(filePath);
          imageUrl = urlData?.publicUrl || null;
        } else {
          // If storage bucket is not configured, store preview as base64 string for demo
          imageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageFile);
          });
        }
      } catch (imgErr) {
        console.warn('Image storage fallback:', imgErr);
      }
    }

    // Default severity/priority assignment (will be refined by AI in Phase 7)
    const reportPayload = {
      case_number: caseNumber,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'General Civic Services',
      subcategory: subcategory,
      status: 'submitted',
      priority: 'moderate',
      severity: 50,
      urgency: 50,
      public_impact: 50,
      impact_score: 50,
      duration_days: 1,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address.trim() || 'Location shared via report',
      image_url: imageUrl,
    };

    const { data: newReport, error: insertErr } = await supabase
      .from('reports')
      .insert(reportPayload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Insert Initial Timeline Update in report_updates
    if (newReport?.id) {
      await supabase.from('report_updates').insert({
        report_id: newReport.id,
        status: 'submitted',
        message: 'Civic report received and registered in the municipal system.',
        actor_id: userId,
      });
    }

    return { success: true, data: newReport };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false, error: error.message || 'Failed to submit report. Please try again.' };
  }
};

/**
 * Get all reports submitted by a specific user
 */
export const getUserReports = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
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
      .select('*, departments(id, name)')
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
      .select('id, case_number, title, description, category, status, priority, impact_score, address, latitude, longitude, created_at')
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
